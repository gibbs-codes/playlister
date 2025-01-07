import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  _id: String,
  address: String,
  venueName: String,
  website: String,
  playlistId: String,
  artistsComing: Array,
  lastPlaylistUpdate: Date,
  lastScraped: { type: Date, default: Date.now },
});

const Venue = mongoose.model('Venue', venueSchema);

export default Venue;
