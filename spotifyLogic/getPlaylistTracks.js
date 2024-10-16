import axios from 'axios';
import { getAccessToken } from '../auth/tokenStore.js';

async function getPlaylistTracks(playlistId) {
  const access_token = getAccessToken();
    const getTracksUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const headers = {
      'Authorization': `Bearer ${access_token}`
    };
    try {
      const response = await axios.get(getTracksUrl, { headers });
      return response.data.items.map(item => item.track.uri);
    } catch (error) {
      console.error('Error getting playlist tracks:', error);
    }
}

export default getPlaylistTracks;