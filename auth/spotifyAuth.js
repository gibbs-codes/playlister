import express from 'express';
import dotenv from 'dotenv';
import querystring from 'querystring';
import axios from 'axios';
import { setAccessToken } from './tokenStore.js';
dotenv.config();

const router = express.Router();
const client_id = 'aaee9bf0dc8b48eab082319bb48d53bb';
const client_secret = 'c04e57e206d542478d6fedfe46c04959';
const redirect_uri = 'http://localhost:8888/callback';
const scopes = 'user-read-private user-read-email playlist-read-private playlist-modify-private playlist-modify-public';


router.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const data = querystring.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirect_uri
  });
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
  };

  try {
    const response = await axios.post(tokenUrl, data, { headers });
    const accessToken = response.data.access_token;
    setAccessToken(accessToken);
    res.send('Authorization successful! You can close this window.');
    console.log('Access Token:', accessToken);
  } catch (error) {
    console.error('Error getting access token:', error);
    res.send('Authorization failed.');
  }
});

export async function refreshAccessToken() {
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const data = querystring.stringify({
    grant_type: 'client_credentials'
  });
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
  };

  try {
    const response = await axios.post(tokenUrl, data, { headers });
    const accessToken = response.data.access_token;
    setAccessToken(accessToken);
    console.log('Access token refreshed:', accessToken);
    return accessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
    throw error;
  }
}

export default router;