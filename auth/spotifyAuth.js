import axios from 'axios';
import querystring from 'querystring';
import { setAccessToken } from './tokenStore.js';

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.SECRET;

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