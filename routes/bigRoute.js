import express from 'express';

const bigRoute = express.Router();

bigRoute.post('/:id', async (req, res) => {
    try {
        let playlistId = req.params.id;
        let songs = [];
        for (const artist of req.body.artists) {
          const tracks = await getTracks(artist);
          songs.push(tracks);
        }
        await addTracksToPlaylist(playlistId, songs.flat());
        res.status(201).json({ message: 'Tracks added to playlist' });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Failed to create show :(" });
  }
});

export default bigRoute;