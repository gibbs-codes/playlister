import axios from 'axios';
import { getAccessToken } from '../auth/tokenStore.js';

async function addTracksToPlaylist(playlistId, trackUris) {
  if (trackUris.length > 200) {
    trackUris = trackUris.slice(0, 199);
  }
  trackUris = trackUris.filter(n => n)
  
  const access_token = getAccessToken();
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };
    const data = {
      uris: trackUris,
      position: 0
    };
  
    try {
      await axios.post(url, data, { headers });
    } catch (error) {
      console.error('Error adding tracks to playlist:', error.response ? error.response.data : error.message);
    }
}

export default addTracksToPlaylist;