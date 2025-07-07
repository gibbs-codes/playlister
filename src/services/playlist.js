// src/services/playlist.js
import VenueScraper from '../scrapers/base.js';
import SpotifyAPIService from './spotify-api.js';
import CacheService from './cache.js';
import ArtistCleanupService from './cleanup.js';
import { getVenueConfig } from '../config/venues.js';

class PlaylistBuilder {
  constructor() {
    this.cache = new CacheService();
    this.scraper = new VenueScraper();
    this.spotify = new SpotifyAPIService(this.cache);
    this.cleanup = new ArtistCleanupService();
  }

  // Main workflow: scrape venue → find artists on Spotify → update playlist
  async updateVenuePlaylist(venueId) {
    console.log(`\n🎯 Updating playlist for venue: ${venueId}`);
    
    try {
      // Get venue configuration
      const venueConfig = getVenueConfig(venueId);
      if (!venueConfig) {
        throw new Error(`Venue configuration not found: ${venueId}`);
      }

      // Step 1: Scrape the venue for upcoming shows
      console.log(`\n📊 Step 1: Scraping ${venueConfig.name}...`);
      const scrapeResult = await this.scraper.scrapeVenue(venueConfig);
      
      if (scrapeResult.artists.length === 0) {
        console.log(`⚠️ No artists found for ${venueConfig.name}`);
        return { success: false, message: 'No artists found' };
      }

      console.log(`✅ Found ${scrapeResult.artists.length} artists: ${scrapeResult.artists.join(', ')}`);

      // Step 1.5: Clean up stale artists
      console.log(`\n🧹 Step 1.5: Cleaning up outdated artists...`);
      const cleanupResult = await this.cleanup.cleanupStaleArtists(venueId, scrapeResult.artists);
      
      if (cleanupResult.removedArtists.length > 0) {
        console.log(`🗑️  Removed ${cleanupResult.removedArtists.length} outdated artists: ${cleanupResult.removedArtists.join(', ')}`);
      } else {
        console.log(`✅ No outdated artists to remove`);
      }

      // Step 2: Get Spotify data for each artist
      console.log(`\n🎵 Step 2: Finding artists on Spotify...`);
      const allTracks = [];
      const foundArtists = [];
      const missedArtists = [];

      for (const artistName of scrapeResult.artists) {
        try {
          const artistData = await this.spotify.getArtistData(artistName);
          
          if (artistData && artistData.topTracks.length > 0) {
            allTracks.push(...artistData.topTracks);
            foundArtists.push(artistData.name);
            console.log(`  ✅ ${artistData.name}: ${artistData.topTracks.length} tracks`);
          } else {
            missedArtists.push(artistName);
            console.log(`  ❌ ${artistName}: not found on Spotify`);
          }

          // Small delay to be nice to Spotify API
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`  ❌ Error processing ${artistName}:`, error.message);
          missedArtists.push(artistName);
        }
      }

      if (allTracks.length === 0) {
        console.log(`⚠️ No Spotify tracks found for any artists`);
        return { success: false, message: 'No tracks found on Spotify' };
      }

      // Step 3: Get or create playlist
      console.log(`\n🎶 Step 3: Updating playlist...`);
      const playlistId = await this.spotify.getOrCreateVenuePlaylist(venueConfig.name, venueId);

      // Step 4: Replace playlist tracks
      await this.spotify.replacePlaylistTracks(playlistId, allTracks);

      // Step 5: Update venue cache
      await this.cache.saveVenue({
        id: venueId,
        name: venueConfig.name,
        scrapeUrl: venueConfig.scrapeUrl,
        playlistId: playlistId,
        lastScraped: new Date(),
        scrapingConfig: venueConfig.scrapingConfig
      });

      const summary = {
        success: true,
        venue: venueConfig.name,
        totalArtists: scrapeResult.artists.length,
        foundOnSpotify: foundArtists.length,
        tracksAdded: allTracks.length,
        playlistId: playlistId,
        foundArtists: foundArtists,
        missedArtists: missedArtists,
        removedArtists: cleanupResult.removedArtists,
        cleanupStats: {
          removed: cleanupResult.removedArtists.length,
          kept: cleanupResult.keptArtists.length
        }
      };

      console.log(`\n✅ Successfully updated ${venueConfig.name} playlist!`);
      console.log(`   📊 ${foundArtists.length}/${scrapeResult.artists.length} artists found on Spotify`);
      console.log(`   🎵 ${allTracks.length} tracks added to playlist`);
      console.log(`   🧹 ${cleanupResult.removedArtists.length} outdated artists removed`);
      
      return summary;

    } catch (error) {
      console.error(`❌ Error updating playlist for ${venueId}:`, error);
      return { 
        success: false, 
        venue: venueId,
        error: error.message 
      };
    }
  }

  // Update all configured venues
  async updateAllVenues() {
    console.log(`\n🌟 Starting weekly playlist update for all venues...`);
    const startTime = Date.now();
    
    // Get all venue configs
    const { venues } = await import('../config/venues.js');
    const results = [];

    for (const venue of venues) {
      console.log(`\n${'='.repeat(50)}`);
      const result = await this.updateVenuePlaylist(venue.id);
      results.push(result);
      
      // Delay between venues to be respectful
      if (venues.length > 1) {
        console.log(`\n⏳ Waiting 5 seconds before next venue...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const successful = results.filter(r => r.success).length;
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎉 Weekly update complete! (${duration}s)`);
    console.log(`✅ ${successful}/${results.length} venues updated successfully`);
    
    const summary = {
      totalVenues: results.length,
      successful: successful,
      failed: results.length - successful,
      duration: duration,
      results: results
    };

    return summary;
  }

  // Test a single venue (useful for debugging)
  async testVenue(venueId) {
    console.log(`🧪 Testing venue: ${venueId}`);
    return await this.updateVenuePlaylist(venueId);
  }
}

export default PlaylistBuilder;