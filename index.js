import express from 'express';
import open from 'open';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import getMonthlyVenueSongKick from './venueScraping/songKickVenueScraper.js';

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.get('/run-monthly-venue', async (req, res) => {
  try {
    const result = await getMonthlyVenueSongKick();
    res.status(200).json({ message: 'getMonthlyVenueSongKick executed successfully', result });
  } catch (error) {
    console.error('Error executing getMonthlyVenueSongKick:', error);
    res.status(500).json({ message: 'Error executing getMonthlyVenueSongKick', error: error.message });
  }
});

const port = process.env.PORT || 3002;

app.listen(port, async () => {
  console.log('its tune time');
  await open(`http://localhost:${port}/login`);
});