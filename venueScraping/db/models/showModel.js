const mongoose = require('mongoose');

const show = new mongoose.Schema({
  _id: String,
  songKick: String,
  address: String,
  venueName: String,
  concertDate: Date,
  concertTime: String,
  linkToBuyTickets: String,  
});

module.exports = mongoose.model('Show', show);
