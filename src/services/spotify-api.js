// src/services/spotify-api.js
import axios from 'axios';
import SpotifyAuth from '../auth/spotify.js';

class SpotifyAPIService {
  constructor(cacheService) {
    this.cache = cacheService;
    this.spotifyAuth = new SpotifyAuth();
    this.baseUrl = 'https://api.spotify.com/v1';
  }

  // Get valid access token (refreshes if needed)
  async getValidAccessToken() {
    const tokens = await this.cache.getSpotifyTokens();
    
    if (!tokens) {
      throw new Error('No Spotify tokens found. Please authorize first.');
    }

    // Check if token is expired
    const now = new Date();
    if (tokens.expiresAt < now) {
      console.log('🔄 Refreshing expired Spotify token...');
      const newTokens = await this.spotifyAuth.refreshAccessToken(tokens.refreshToken);
      await this.cache.saveSpotifyTokens(newTokens.accessToken, newTokens.refreshToken, newTokens.expiresIn);
      return newTokens.accessToken;
    }

    return tokens.accessToken;
  }

  // Make authenticated request to Spotify API
  async spotifyRequest(endpoint, options = {}) {
    const accessToken = await this.getValidAccessToken();
    
    const config = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await axios(`${this.baseUrl}${endpoint}`, config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token might be invalid, try to refresh once
        console.log('🔄 Token invalid, attempting refresh...');
        const tokens = await this.cache.getSpotifyTokens();
        const newTokens = await this.spotifyAuth.refreshAccessToken(tokens.refreshToken);
        await this.cache.saveSpotifyTokens(newTokens.accessToken, newTokens.refreshToken, newTokens.expiresIn);
        
        // Retry the request with new token
        config.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
        const retryResponse = await axios(`${this.baseUrl}${endpoint}`, config);
        return retryResponse.data;
      }
      throw error;
    }
  }

  // Smart band name splitting for multi-artist listings
  splitMultiArtistNames(artistName) {
    console.log(`🔍 Checking if "${artistName}" contains multiple artists...`);
    
    // Common separators for multiple artists
    const separators = [
      ' and ', ' & ', ' + ', ' w/ ', ' with ', ' ft. ', ' feat. ', ' featuring '
    ];
    
    for (const separator of separators) {
      if (artistName.toLowerCase().includes(separator.toLowerCase())) {
        const parts = artistName.split(new RegExp(separator, 'i'))
          .map(part => part.trim())
          .filter(part => part.length > 0);
        
        if (parts.length > 1) {
          console.log(`✂️  Split "${artistName}" into: ${parts.join(', ')}`);
          return parts;
        }
      }
    }
    
    // No splitting needed
    return [artistName];
  }

  // Clean up artist names (remove common prefixes/suffixes)
  cleanArtistName(name) {
    return name
      .replace(/^(the\s+)/i, '') // Remove "the" prefix
      .replace(/\s+(band|duo|trio|quartet)$/i, '') // Remove band type suffixes
      .replace(/\s+(live|acoustic|unplugged)$/i, '') // Remove performance type
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Search for an artist and get their info + top tracks
  async searchArtistAndTracks(artistName) {
    console.log(`🔍 Searching Spotify for: ${artistName}`);
    
    try {
      // Search for the artist with more results to find better matches
      const searchData = await this.spotifyRequest(`/search?q=${encodeURIComponent(artistName)}&type=artist&limit=10`);
      
      if (!searchData.artists.items.length) {
        console.log(`❌ No Spotify results for: ${artistName}`);
        return null;
      }

      // Find the best match using strict name matching
      const bestMatch = this.findBestArtistMatch(artistName, searchData.artists.items);
      
      if (!bestMatch) {
        console.log(`❌ No exact match for "${artistName}" in Spotify results`);
        console.log(`   Available: ${searchData.artists.items.slice(0, 3).map(a => a.name).join(', ')}`);
        return null;
      }

      console.log(`✅ Found exact match: ${bestMatch.name} (${bestMatch.popularity} popularity)`);

      // Get their top tracks
      const topTracksData = await this.spotifyRequest(`/artists/${bestMatch.id}/top-tracks?market=US`);
      const topTracks = topTracksData.tracks.slice(0, 3).map(track => track.uri); // Top 3 tracks

      if (topTracks.length === 0) {
        console.log(`⚠️ ${bestMatch.name} has no popular tracks, skipping...`);
        return null;
      }

      const artistData = {
        name: bestMatch.name,
        spotifyId: bestMatch.id,
        topTracks: topTracks,
        popularity: bestMatch.popularity
      };

      // Cache the artist data
      await this.cache.saveArtist(artistData);
      
      return artistData;

    } catch (error) {
      console.error(`❌ Error searching for ${artistName}:`, error.message);
      return null;
    }
  }

  // Strict artist name matching to prevent false positives
  findBestArtistMatch(searchName, spotifyResults) {
    const normalizeForMatching = (name) => {
      return name.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation  
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();
    };

    const searchNormalized = normalizeForMatching(searchName);
    
    // Try different matching strategies in order of preference
    
    // 1. Exact match (case insensitive)
    for (const artist of spotifyResults) {
      if (normalizeForMatching(artist.name) === searchNormalized) {
        console.log(`🎯 Exact match: "${searchName}" = "${artist.name}"`);
        return artist;
      }
    }
    
    // 2. Handle common variations ("The Band" vs "Band")
    for (const artist of spotifyResults) {
      const artistNormalized = normalizeForMatching(artist.name);
      
      // Remove "the" from both and compare
      const searchNoThe = searchNormalized.replace(/^the\s+/, '');
      const artistNoThe = artistNormalized.replace(/^the\s+/, '');
      
      if (searchNoThe === artistNoThe && searchNoThe.length > 0) {
        console.log(`🎯 Match without "the": "${searchName}" = "${artist.name}"`);
        return artist;
      }
    }
    
    // 3. Flexible matching for reasonable variations (but still strict)
    for (const artist of spotifyResults) {
      const artistNormalized = normalizeForMatching(artist.name);
      
      // Allow if search name is contained in artist name AND they're close in length
      const lengthDiff = Math.abs(searchNormalized.length - artistNormalized.length);
      
      if (artistNormalized.includes(searchNormalized) && lengthDiff <= 4 && searchNormalized.length >= 3) {
        console.log(`🎯 Flexible match: "${searchName}" found in "${artist.name}"`);
        return artist;
      }
      
      // Or if artist name is contained in search name (handles extra words)
      if (searchNormalized.includes(artistNormalized) && lengthDiff <= 4 && artistNormalized.length >= 3) {
        console.log(`🎯 Flexible match: "${artist.name}" found in "${searchName}"`);
        return artist;
      }
    }
    
    // 4. No match found - be strict!
    console.log(`❌ No acceptable match for "${searchName}"`);
    console.log(`   Considered: ${spotifyResults.slice(0, 3).map(a => `"${a.name}"`).join(', ')}`);
    return null;
  }

  // Updated method that handles multi-artist names
  async getArtistData(artistName) {
    console.log(`🎵 Processing artist: ${artistName}`);
    
    // Check cache first
    const cached = await this.cache.getArtist(artistName);
    
    if (cached) {
      const daysSinceCheck = (Date.now() - cached.lastSpotifyCheck) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCheck < 7 && cached.spotifyId) {
        console.log(`📋 Using cached data for: ${artistName}`);
        return cached;
      }
    }

    // Try to find as a single artist first
    const singleResult = await this.searchArtistAndTracks(artistName);
    if (singleResult) {
      return singleResult;
    }

    // If no single match, try splitting into multiple artists
    const artistParts = this.splitMultiArtistNames(artistName);
    
    if (artistParts.length > 1) {
      console.log(`🎭 Trying to find individual artists from "${artistName}"...`);
      
      const foundArtists = [];
      const allTracks = [];
      
      for (const part of artistParts) {
        // Clean up common prefixes/suffixes
        const cleanPart = this.cleanArtistName(part);
        
        if (cleanPart.length >= 2) { // Skip very short parts
          const partResult = await this.searchArtistAndTracks(cleanPart);
          if (partResult) {
            foundArtists.push(partResult.name);
            allTracks.push(...partResult.topTracks);
            console.log(`  ✅ Found: ${partResult.name}`);
          } else {
            console.log(`  ❌ Not found: ${cleanPart}`);
          }
        }
      }
      
      if (foundArtists.length > 0) {
        // Create a combined result for the multi-artist listing
        const combinedResult = {
          name: artistName, // Keep original name for cache
          spotifyId: `multi_${foundArtists.join('_')}`, // Synthetic ID
          topTracks: allTracks.slice(0, 6), // More tracks since it's multiple artists
          popularity: Math.max(...foundArtists.map(() => 50)), // Reasonable default
          isMultiArtist: true,
          foundArtists: foundArtists
        };
        
        // Cache the combined result
        await this.cache.saveArtist(combinedResult);
        
        console.log(`✅ Multi-artist success: Found ${foundArtists.length}/${artistParts.length} artists`);
        console.log(`   Artists: ${foundArtists.join(', ')}`);
        
        return combinedResult;
      }
    }

    // Nothing found
    console.log(`❌ No matches found for: ${artistName}`);
    return null;
  }

  // Get current user's playlists
  async getUserPlaylists() {
    const data = await this.spotifyRequest('/me/playlists?limit=50');
    return data.items;
  }

  // Create a new playlist
  async createPlaylist(name, description = '', isPublic = false) {
    console.log(`🎵 Creating playlist: ${name}`);
    
    // Get current user ID
    const userData = await this.spotifyRequest('/me');
    
    const playlistData = await this.spotifyRequest(`/users/${userData.id}/playlists`, {
      method: 'POST',
      data: {
        name: name,
        description: description,
        public: isPublic
      }
    });

    console.log(`✅ Created playlist: ${playlistData.name} (${playlistData.id})`);
    return playlistData;
  }

  // Replace all tracks in a playlist
  async replacePlaylistTracks(playlistId, trackUris) {
    console.log(`🎵 Replacing playlist tracks (${trackUris.length} tracks)`);
    
    // Spotify API limit is 100 tracks per request
    const chunks = [];
    for (let i = 0; i < trackUris.length; i += 100) {
      chunks.push(trackUris.slice(i, i + 100));
    }

    // Replace tracks (first chunk)
    if (chunks.length > 0) {
      await this.spotifyRequest(`/playlists/${playlistId}/tracks`, {
        method: 'PUT',
        data: {
          uris: chunks[0]
        }
      });
    }

    // Add remaining chunks
    for (let i = 1; i < chunks.length; i++) {
      await this.spotifyRequest(`/playlists/${playlistId}/tracks`, {
        method: 'POST',
        data: {
          uris: chunks[i]
        }
      });
    }

    console.log(`✅ Updated playlist with ${trackUris.length} tracks`);
  }

  // Get or create a playlist for a venue
  async getOrCreateVenuePlaylist(venueName, venueId) {
    const playlistName = `Upcoming | ${venueName}`;
    const description = `Upcoming shows at ${venueName} - Updated weekly`;

    // Check if venue already has a playlist ID
    const venue = await this.cache.getVenue(venueId);
    if (venue?.playlistId) {
      try {
        // Verify the playlist still exists
        await this.spotifyRequest(`/playlists/${venue.playlistId}`);
        console.log(`📋 Using existing playlist for ${venueName}`);
        return venue.playlistId;
      } catch (error) {
        console.log(`⚠️ Existing playlist not found, creating new one for ${venueName}`);
      }
    }

    // Create new playlist
    const playlist = await this.createPlaylist(playlistName, description);
    await this.cache.updateVenuePlaylist(venueId, playlist.id);
    
    return playlist.id;
  }
}

export default SpotifyAPIService;