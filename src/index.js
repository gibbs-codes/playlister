// src/index.js
import express from 'express';
import dotenv from 'dotenv';
import SpotifyAuth from './auth/spotify.js';
import CacheService from './services/cache.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const spotifyAuth = new SpotifyAuth();
const cache = new CacheService();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'playlister-v2'
  });
});

// Spotify auth flow
app.get('/auth/spotify', (req, res) => {
  const authUrl = spotifyAuth.getAuthUrl();
  console.log('🔐 Visit this URL to authorize Spotify:');
  console.log(authUrl);
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Authorization failed - no code received');
  }

  try {
    const tokens = await spotifyAuth.exchangeCodeForTokens(code);
    await cache.saveSpotifyTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
    
    console.log('✅ Spotify authorization successful!');
    res.send(`
      <h2>✅ Spotify Authorization Successful!</h2>
      <p>You can close this window. Your app is now connected to Spotify.</p>
      <p>Refresh token saved - this won't expire!</p>
    `);
  } catch (error) {
    console.error('❌ Authorization failed:', error);
    res.status(500).send('Authorization failed');
  }
});

// Test endpoint to verify Spotify connection
app.get('/test/spotify', async (req, res) => {
  try {
    const tokens = await cache.getSpotifyTokens();
    if (!tokens) {
      return res.json({ 
        status: 'not_authorized',
        message: 'Visit /auth/spotify to connect your Spotify account'
      });
    }

    // Check if token is expired
    const now = new Date();
    const isExpired = tokens.expiresAt < now;
    
    res.json({
      status: 'authorized',
      tokenExpired: isExpired,
      expiresAt: tokens.expiresAt,
      message: isExpired ? 'Token expired but can be refreshed' : 'Ready to make Spotify API calls'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import additional services for API routes
import VenueScraper from './scrapers/base.js';
import SpotifyAPIService from './services/spotify-api.js';
import PlaylistBuilder from './services/playlist.js';
import PlaylistScheduler from './scheduler.js';
import { getVenueConfig, getAllVenueIds, getVenueCount } from './config/venues.js';

import ArtistCleanupService from './services/cleanup.js';

// Initialize services
const playlistBuilder = new PlaylistBuilder();
const scheduler = new PlaylistScheduler();
const cleanup = new ArtistCleanupService();

// Test scraping only (no Spotify API calls)
app.post('/api/test-scrape/:venueId', async (req, res) => {
  try {
    const venueConfig = getVenueConfig(req.params.venueId);
    if (!venueConfig) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const scraper = new VenueScraper();
    const result = await scraper.scrapeVenue(venueConfig);
    
    res.json({
      venue: venueConfig.name,
      url: venueConfig.scrapeUrl,
      artists: result.artists,
      method: result.method,
      scrapedAt: result.scrapedAt,
      error: result.error
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test a single venue end-to-end
app.post('/api/test-venue/:venueId', async (req, res) => {
  try {
    const result = await scheduler.testVenue(req.params.venueId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manual trigger for all playlists
app.post('/api/update-playlists', async (req, res) => {
  try {
    const results = await scheduler.runNow();
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    scheduler: scheduler.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// Debug Spotify configuration
app.get('/debug/spotify-config', (req, res) => {
  res.json({
    clientId: process.env.SPOTIFY_CLIENT_ID ? `${process.env.SPOTIFY_CLIENT_ID.slice(0, 8)}...` : 'MISSING',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET ? 'Present' : 'MISSING',
    redirectUri: spotifyAuth.redirectUri,
    authUrl: spotifyAuth.getAuthUrl(),
    environment: {
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// Cleanup testing routes
app.get('/api/cleanup/stats', async (req, res) => {
  try {
    const stats = await cleanup.getCleanupStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cleanup/force/:venueId', async (req, res) => {
  try {
    const result = await cleanup.forceCleanupVenue(req.params.venueId);
    res.json({ message: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all available venues
app.get('/api/venues/list', (req, res) => {
  const { venues } = require('./config/venues.js');
  res.json({
    total: getVenueCount(),
    venues: venues.map(v => ({
      id: v.id,
      name: v.name,
      url: v.scrapeUrl
    }))
  });
});

// Test scraping all venues (just scraping, no Spotify)
app.post('/api/test-scrape-all', async (req, res) => {
  try {
    const { venues } = await import('./config/venues.js');
    const scraper = new VenueScraper();
    
    console.log(`🎵 Testing scraping for all ${venues.length} venues...`);
    const results = await scraper.scrapeMultipleVenues(venues, 2000); // 2 second delay between venues
    
    const summary = {
      totalVenues: venues.length,
      successful: results.filter(r => r.artists.length > 0).length,
      results: results.map(r => ({
        venue: r.venueName,
        artistCount: r.artists.length,
        artists: r.artists.slice(0, 3), // First 3 artists only
        method: r.method,
        error: r.error
      }))
    };
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test specific venues by name pattern
app.post('/api/test-venues/:pattern', async (req, res) => {
  try {
    const pattern = req.params.pattern.toLowerCase();
    const { venues } = await import('./config/venues.js');
    
    const matchingVenues = venues.filter(v => 
      v.name.toLowerCase().includes(pattern) || 
      v.id.toLowerCase().includes(pattern)
    );
    
    if (matchingVenues.length === 0) {
      return res.status(404).json({ 
        error: `No venues found matching "${pattern}"`,
        availableVenues: venues.map(v => v.id)
      });
    }
    
    const results = [];
    for (const venue of matchingVenues) {
      console.log(`\n🎯 Testing ${venue.name}...`);
      const result = await scheduler.testVenue(venue.id);
      results.push(result);
      
      // Small delay between venues
      if (matchingVenues.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    res.json({
      pattern: pattern,
      matchedVenues: matchingVenues.length,
      results: results
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Playlister v2 running on port ${port}`);
  
  // Debug Spotify configuration
  console.log('\n🔧 Spotify Configuration:');
  console.log(`   Client ID: ${process.env.SPOTIFY_CLIENT_ID ? `${process.env.SPOTIFY_CLIENT_ID.slice(0, 8)}...` : 'MISSING ❌'}`);
  console.log(`   Client Secret: ${process.env.SPOTIFY_CLIENT_SECRET ? 'Present ✅' : 'MISSING ❌'}`);
  console.log(`   Redirect URI: ${spotifyAuth.redirectUri}`);
  
  console.log('\n📋 Testing URLs:');
  console.log(`   🔑 Auth: http://localhost:${port}/auth/spotify`);
  console.log(`   🔧 Config: http://localhost:${port}/debug/spotify-config`);
  console.log(`   📍 Venues: http://localhost:${port}/api/venues/list`);
  console.log(`   🧪 Test scrape one: curl -X POST http://localhost:${port}/api/test-scrape/sleeping-village`);
  console.log(`   🧪 Test scrape all: curl -X POST http://localhost:${port}/api/test-scrape-all`);
  console.log(`   🎵 Test venue: curl -X POST http://localhost:${port}/api/test-venue/sleeping-village`);
  console.log(`   🚀 Update all: curl -X POST http://localhost:${port}/api/update-playlists`);
});

export default app;