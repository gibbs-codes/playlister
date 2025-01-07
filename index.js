import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './db/index.js';
import venueRouter from './routes/venueRoutes.js';
import showRouter from './routes/showRoutes.js';
import getMonthlyVenueSongKick from './venueScraping/songKickVenueScraper.js';
import spotifyBatch from './spotifyLogic/spotifyBatch.js';
import login from './auth/login.js';
import bigRouter from './routes/bigRoute.js';
import playlistRouter from './routes/playlistRoutes.js';
import spotifyAuth from './auth/spotifyAuth.js';
import { getAccessToken, setAccessToken } from './auth/tokenStore.js';


dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/venues', venueRouter);
app.use('/api/shows', showRouter);
app.use('/makeReport', async (req, res) => {
  try {
    let monthlyRoundUp = await getMonthlyVenueSongKick();
    if (monthlyRoundUp) {
      let result = await spotifyBatch();
      if (result) {
        res.status(200).json({ message: 'makeReport executed successfully' });
      } else {
        res.status(202).json({ message: 'Error executing spotifyBatch' });
      }
    } else {
      res.status(202).json({ message: 'Error executing getMonthlyVenueSongKick' });
    }
  } catch (err) {
    console.log('Error executing getMonthlyVenueSongKick:', err)
    res.status(202).json({ message: 'Error executing getMonthlyVenueSongKick', error: err.message });
   }
let token = getAccessToken();
if (!token) {
  login();
}});

app.use(express.json());
app.use('/', spotifyAuth);
app.use('/callback', async (req, res) => {
   console.log(req.params)
  res.status(200).json({ message: 'callback' });
});
app.use('/api/doit', bigRouter);
app.use('/api/playlist', playlistRouter);

const port = process.env.PORT || 3002;

app.listen(port, async () => {
  console.log('its tune time');
  await connectDB();
});