import axios from 'axios';
import { getAccessToken } from '../auth/tokenStore.js';

async function searchArtists(query) {
  const access_token = getAccessToken();
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist`;
    const headers = {
      'Authorization': `Bearer ${access_token}`
    };
  
    try {
      const response = await axios.get(searchUrl, { headers });
      const artists = response.data.artists.items;
      if (artists[0].name !== query) {
        console.log('Artist not found');
        return null;
      }
      return artists.length > 0 ? artists[0] : null; 
    } catch (error) {
      console.error('Error searching for artists:', error);
    }
}

export default searchArtists;