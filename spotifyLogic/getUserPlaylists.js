import axios from 'axios';
import { getAccessToken } from '../auth/tokenStore.js';
import { refreshAccessToken } from '../auth/spotifyAuth.js';

async function getUserPlaylists() {
  let accessToken = getAccessToken();
  const playlistsUrl = 'https://api.spotify.com/v1/me/playlists';
  const headers = {
    'Authorization': `Bearer ${accessToken}`
  };
  try {
    const response = await axios.get(playlistsUrl, { headers });
    return response.data.items;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      accessToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retryResponse = await axios.get(playlistsUrl, { headers });
      return retryResponse.data;
    } else {
      console.error('Error getting user playlists:', error.response ? error.response.data : error.message);
    }
  }
}

export default getUserPlaylists;