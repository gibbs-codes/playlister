// src/services/cleanup.js
import CacheService from './cache.js';

class ArtistCleanupService {
  constructor() {
    this.cache = new CacheService();
  }

  // Main cleanup logic - removes artists not in current scraping results
  async cleanupStaleArtists(venueId, currentArtists) {
    console.log(`🧹 Cleaning up stale artists for venue: ${venueId}`);
    
    try {
      const venue = await this.cache.getVenue(venueId);
      if (!venue || !venue.previousArtists) {
        console.log(`📝 First time for venue ${venueId}, storing current artists`);
        await this.cache.updateVenuePreviousArtists(venueId, currentArtists);
        return { removedArtists: [], keptArtists: currentArtists };
      }

      const previousArtists = venue.previousArtists || [];
      const removedArtists = previousArtists.filter(artist => 
        !currentArtists.some(current => 
          this.artistNamesMatch(artist, current)
        )
      );

      const keptArtists = currentArtists;

      if (removedArtists.length > 0) {
        console.log(`🗑️  Removed ${removedArtists.length} artists no longer appearing: ${removedArtists.join(', ')}`);
        
        // Optionally clean them from the global artist cache if they're old
        await this.cleanupOldArtistCache(removedArtists);
      }

      // Update venue with current artists for next comparison
      await this.cache.updateVenuePreviousArtists(venueId, currentArtists);

      return { removedArtists, keptArtists };

    } catch (error) {
      console.error(`❌ Error cleaning up artists for ${venueId}:`, error);
      return { removedArtists: [], keptArtists: currentArtists };
    }
  }

  // Smart artist name matching (handles slight variations)
  artistNamesMatch(name1, name2) {
    const normalize = (name) => name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .trim();
    
    const normalized1 = normalize(name1);
    const normalized2 = normalize(name2);
    
    // Exact match
    if (normalized1 === normalized2) return true;
    
    // Check if one contains the other (handles "Band" vs "The Band")
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      const lengthDiff = Math.abs(normalized1.length - normalized2.length);
      return lengthDiff <= 4; // Allow small differences like "The " prefix
    }
    
    return false;
  }

  // Remove old artists from global cache if they haven't been seen in any venue for a while
  async cleanupOldArtistCache(removedArtists, maxAgeMonths = 3) {
    console.log(`🧹 Checking if removed artists should be cleaned from global cache...`);
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - maxAgeMonths);

    for (const artistName of removedArtists) {
      try {
        const artist = await this.cache.getArtist(artistName);
        
        if (artist && artist.lastSpotifyCheck < cutoffDate) {
          // Check if this artist appears in any current venue lineups
          const allVenues = await this.cache.getAllVenues();
          const stillActive = allVenues.some(venue => 
            venue.previousArtists?.some(venueArtist => 
              this.artistNamesMatch(artistName, venueArtist)
            )
          );

          if (!stillActive) {
            await this.cache.removeArtist(artistName);
            console.log(`🗑️  Removed ${artistName} from global cache (inactive for ${maxAgeMonths} months)`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error checking artist ${artistName} for cleanup:`, error.message);
      }
    }
  }

  // Get cleanup stats for all venues
  async getCleanupStats() {
    const venues = await this.cache.getAllVenues();
    const stats = [];

    for (const venue of venues) {
      const currentArtists = venue.previousArtists || [];
      const lastScraped = venue.lastScraped;
      const daysSinceUpdate = lastScraped ? 
        Math.floor((Date.now() - lastScraped.getTime()) / (1000 * 60 * 60 * 24)) : 
        null;

      stats.push({
        venueId: venue.id,
        venueName: venue.name,
        currentArtists: currentArtists.length,
        lastScraped: lastScraped,
        daysSinceUpdate: daysSinceUpdate
      });
    }

    return stats;
  }

  // Manual cleanup trigger for testing
  async forceCleanupVenue(venueId) {
    console.log(`🧪 Force cleaning venue: ${venueId}`);
    
    const venue = await this.cache.getVenue(venueId);
    if (!venue) {
      throw new Error(`Venue ${venueId} not found`);
    }

    // Clear previous artists to force fresh comparison
    await this.cache.updateVenuePreviousArtists(venueId, []);
    
    return `Cleared previous artists for ${venue.name}. Next scrape will treat all artists as new.`;
  }
}

export default ArtistCleanupService;