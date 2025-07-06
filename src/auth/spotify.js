// src/auth/spotify.js
import axios from 'axios';
import querystring from 'querystring';

class SpotifyAuth {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/spotify/callback';
    this.scopes = 'playlist-modify-public playlist-modify-private user-read-private';
  }

  // Generate authorization URL (user visits this once)
  getAuthUrl() {
    const params = querystring.stringify({
      response_type: 'code',
      client_id: this.clientId,
      scope: this.scopes,
      redirect_uri: this.redirectUri,
    });
    return `https://accounts.spotify.com/authorize?${params}`;
  }

  // Exchange authorization code for tokens (called from callback)
  async exchangeCodeForTokens(code) {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const data = querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.redirectUri,
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    };

    try {
      const response = await axios.post(tokenUrl, data, { headers });
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error.response?.data);
      throw error;
    }
  }

  // Get fresh access token using refresh token
  async refreshAccessToken(refreshToken) {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const data = querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    };

    try {
      const response = await axios.post(tokenUrl, data, { headers });
      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        // Note: refresh token might not be returned, keep the old one
        refreshToken: response.data.refresh_token || refreshToken
      };
    } catch (error) {
      console.error('Error refreshing access token:', error.response?.data);
      throw error;
    }
  }
}

export default SpotifyAuth;