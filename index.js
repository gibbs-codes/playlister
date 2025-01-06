import express from 'express';
import dotenv from 'dotenv';
import login from './auth/login.js';
import bigRouter from './routes/bigRoute.js';
import playlistRouter from './routes/playlistRoutes.js';
import spotifyAuth from './auth/spotifyAuth.js';
import { getAccessToken, setAccessToken } from './auth/tokenStore.js';


dotenv.config();

const app = express();
let token = getAccessToken();
if (!token) {
  login();
}

app.use(express.json());
app.use('/', spotifyAuth);
app.use('/callback', async (req, res) => {
   console.log(req.params)
  res.status(200).json({ message: 'callback' });
});
app.use('/api/doit', bigRouter);
app.use('/api/playlist', playlistRouter);

const port = process.env.PORT

app.listen(port, async () => {
  console.log('its tune time at port', port);
});