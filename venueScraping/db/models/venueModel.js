const mongoose = require('mongoose');

const venue = new mongoose.Schema({
  _id: String,
  songKick: String,
  address: String,
  venueName: String,
  website: String,
  artistsComing: Array,
  lastScraped: Date,
});

module.exports = mongoose.model('Venue', venue);
