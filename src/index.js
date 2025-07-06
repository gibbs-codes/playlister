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

app.get('/auth/spotify/callback', async (req, res) => {
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

app.listen(port, () => {
  console.log(`🚀 Playlister v2 running on port ${port}`);
  console.log(`🔑 To authorize Spotify, visit: http://localhost:${port}/auth/spotify`);
});

export default app;