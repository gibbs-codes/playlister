import express from 'express';
import Venue from '../models/venueModel.js';
const venueRouter = express.Router();

venueRouter.get('/', async (req, res) => {
    console.log('get venues')
  try {
    const venueList = await Venue.find();
    const songKickList = venueList.map((venue) => venue._id); 
    res.json(songKickList);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

venueRouter.post('/', async (req, res) => {
  try {
    console.log(req.body)
    const newVenue = new Venue(req.body)
    await newVenue.save();
    res.status(201).json(newVenue);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Failed to create item" });
  }
});

venueRouter.get('/:id', async (req, res) => {
    console.log('get ONE')
    try {
        const venue = await Venue.findOne({ _id: req.params.id })
        res.json(venue);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
});
  
venueRouter.put('/:id', async (req, res) => {
    try {
        const updatedVenue = await Venue.findByIdAndUpdate(req.params.id, {artistsComing: req.body.artistsComing, lastScraped: Date.now() }, {new: true})
        res.json(updatedVenue);
    } catch (err) {
      res.status(500).json({ error: "Failed to create item" });
    }
});

export default venueRouter;