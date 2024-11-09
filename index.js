import dotenv from 'dotenv';
import getMonthlyVenueSongKick from './venueScraping/songKickVenueScraper.js';
import { refreshAccessToken } from './auth/spotifyAuth.js';

dotenv.config();

export const handler = async (event) => {
  try {
    // Refresh the access token
    const accessToken = await refreshAccessToken();
    console.log('Access token refreshed:', accessToken);

    // Run the getMonthlyVenueSongKick function
    const result = await getMonthlyVenueSongKick();
    console.log('getMonthlyVenueSongKick executed successfully:', result);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'getMonthlyVenueSongKick executed successfully', result }),
    };
  } catch (error) {
    console.error('Error executing getMonthlyVenueSongKick:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error executing getMonthlyVenueSongKick', error: error.message }),
    };
  }
};