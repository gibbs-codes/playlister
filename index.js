import express from 'express';
import open from 'open';
import dotenv from 'dotenv';
import spotifyAuth from './auth/spotifyAuth.js';
import { tokenMiddleware } from './auth/tokenMiddleware.js';
import getMonthlyVenueSongKick from './venueScraping/songKickVenueScraper.js';
import createPlaylist from './spotifyLogic/createPlaylist.js';

dotenv.config();

const app = express();

app.use('/', spotifyAuth);

// Example route that requires the access token
app.get('/protected', tokenMiddleware, (req, res) => {
  res.send(`Access token is: ${req.accessToken}`);
});

app.get('/run-monthly-venue', async (req, res) => {
  try {
    const result = await getMonthlyVenueSongKick();
    res.status(200).json({ message: 'getMonthlyVenueSongKick executed successfully', result });
  } catch (error) {
    console.error('Error executing getMonthlyVenueSongKick:', error);
    res.status(500).json({ message: 'Error executing getMonthlyVenueSongKick', error: error.message });
  }
});