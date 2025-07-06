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

  // Search for an artist and get their info + top tracks
  async searchArtistAndTracks(artistName) {
    console.log(`🔍 Searching Spotify for: ${artistName}`);
    
    try {
      // Search for the artist
      const searchData = await this.spotifyRequest(`/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`);
      
      if (!searchData.artists.items.length) {
        console.log(`❌ No Spotify results for: ${artistName}`);
        return null;
      }

      const artist = searchData.artists.items[0];
      console.log(`✅ Found artist: ${artist.name} (${artist.popularity} popularity)`);

      // Get their top tracks
      const topTracksData = await this.spotifyRequest(`/artists/${artist.id}/top-tracks?market=US`);
      const topTracks = topTracksData.tracks.slice(0, 3).map(track => track.uri); // Top 3 tracks

      const artistData = {
        name: artist.name,
        spotifyId: artist.id,
        topTracks: topTracks,
        popularity: artist.popularity
      };

      // Cache the artist data
      await this.cache.saveArtist(artistData);
      
      return artistData;

    } catch (error) {
      console.error(`❌ Error searching for ${artistName}:`, error.message);
      return null;
    }
  }

  // Get or refresh artist data (checks cache first)
  async getArtistData(artistName) {
    // Check cache first
    const cached = await this.cache.getArtist(artistName);
    
    if (cached) {
      const daysSinceCheck = (Date.now() - cached.lastSpotifyCheck) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCheck < 7 && cached.spotifyId) {
        console.log(`📋 Using cached data for: ${artistName}`);
        return cached;
      }
    }

    // Search Spotify for fresh data
    return await this.searchArtistAndTracks(artistName);
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