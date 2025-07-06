import axios from 'axios';
import dotenv from 'dotenv';
import { getAccessToken } from '../auth/tokenStore.js';
dotenv.config();
const user_id =  '315o6js2bgmqotzowgyhnoyz5t24'

async function createPlaylist(name, description) {
  const access_token = getAccessToken();
    const createPlaylistUrl = `https://api.spotify.com/v1/users/${user_id}/playlists`;
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };
    const data = {
      name: name,
      description: description,
      public: false
    };
  
    try {
      const response = await axios.post(createPlaylistUrl, data, { headers });
      return response.data.id;
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
}

export default createPlaylist;