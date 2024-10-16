import axios from 'axios';
import { getAccessToken } from '../auth/tokenStore.js';

async function updatePlaylistDescription(playlistId, description) {
    const access_token = getAccessToken();
    const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
    const headers = {
      'Authorization': `Bearer ${access_token}`, // Ensure access_token is valid and has the necessary scopes
      'Content-Type': 'application/json'
    };
    const data = {
      description: description
    };
  
    try {
      const response = await axios.put(url, data, { headers });
      console.log('Playlist description updated:', response.data);
    } catch (error) {
      console.error('Error updating playlist description:', error.response ? error.response.data : error.message);
      throw error;
    }
}

export default updatePlaylistDescription;