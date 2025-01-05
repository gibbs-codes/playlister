const db = require('./index.js');
const mongoose = require('mongoose');

const venue = {
    getURLs: () => {
        const venueList =  db.venue.find();
        const songKickList = venueList.map((venue) => venue.songKick);
        return songKickList;
    },
    getOne: (item) => db.venue.findOne(item),
    addNew: (item) => db.venue.create(item),
    update: (id, item) => db.venue.findByIdAndUpdate(id, item, {new: true}),
  };
  
  const show = {
    getAll: () => db.show.find(),
    getVenue: (item) => db.show.find(item),
    post: (item) => db.show.create(item),
    getOne: (item) => db.show.findOne(item)
  };
  
  const playlist = {
    get: (id) => db.products.find({iD: id})
  };
  
  module.exports = {venue, show, playlist};