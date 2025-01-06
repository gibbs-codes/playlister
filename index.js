import express from 'express';
import open from 'open';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './db/index.js';
import venueRouter from './routes/venueRoutes.js';
import showRouter from './routes/showRoutes.js';
import getMonthlyVenueSongKick from './venueScraping/songKickVenueScraper.js';

dotenv.config();

connectDB();

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/venues', venueRouter);
app.use('/api/shows', showRouter);
app.use('/makeReport', (req, res) => {
  try {
    getMonthlyVenueSongKick()
    res.status(200).json({ message: 'getMonthlyVenueSongKick executed successfully' });
  } catch (err) {
    console.log('Error executing getMonthlyVenueSongKick:', err)
    res.status(202).json({ message: 'Error executing getMonthlyVenueSongKick', error: err.message });
   }
});

const port = process.env.PORT || 3002;

app.listen(port, async () => {
  console.log('its tune time');
});