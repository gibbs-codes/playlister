import express from 'express';
import Show from '../models/showModel.js';
const showRouter = express.Router();

showRouter.get('/', async (req, res) => {
  console.log('get shows')
  try {
    const shows = await Show.find();
    console.log(shows)
    res.json(shows);
  } catch (err) {
    res.status(500).json({ error: "Failed to get shows :(" });
  }
});

showRouter.post('/', async (req, res) => {
  try {
    const newShow = new Show(req.body)
    await newShow.save();
    res.status(201).json(newVenue);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Failed to create show :(" });
  }
});

showRouter.get('/:id', async (req, res) => {
    try {
        const venue = await Show.find({ _id: req.params.id })
        res.json(venue);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
});

export default showRouter;