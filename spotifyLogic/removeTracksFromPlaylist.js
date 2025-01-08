import axios from 'axios';
import { getAccessToken } from '../auth/tokenStore.js';

async function removeTracksFromPlaylist(playlistId, trackUris) {
  const access_token = getAccessToken();
    const removeTracksUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };
    const data = {
      tracks: trackUris.map(uri => ({ uri }))
    };
  
    if (data.length > 0) {
        try {
          await axios.delete(removeTracksUrl, { headers, data });
        } catch (error) {
          console.error('Error removing tracks from playlist:', error);
        }
    }
}

export default removeTracksFromPlaylist;