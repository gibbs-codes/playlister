import axios from 'axios';
import { getAccessToken } from '../auth/tokenStore.js';

async function getTopTracks(artistId) {
  const access_token = getAccessToken();
    const topTracksUrl = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`;
    const headers = {
      'Authorization': `Bearer ${access_token}`
    };
    try {
      const response = await axios.get(topTracksUrl, { headers });
      return response.data.tracks;
    } catch (error) {
      console.error('Error getting top tracks:', error);
    }
}

export default getTopTracks;