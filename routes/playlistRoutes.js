import express from 'express';
import playlistCheck from '../spotifyLogic/playlistCheck.js';

const playlistRouter = express.Router();

playlistRouter.get('/', async (req, res) => {
  try {
    res.status(200).json('hiya buddy');
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Failed to create show :(" });
  }
});

playlistRouter.post('/', async (req, res) => {
  try {
    const playlistId = await playlistCheck(`Upcoming|${req.body.venue}`, `Upcoming at ${req.body.venue}`)
    console.log(playlistId);
    res.status(201).json(playlistId);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Failed to create show :(" });
  }
});

export default playlistRouter;