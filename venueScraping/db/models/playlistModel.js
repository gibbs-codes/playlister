const mongoose = require('mongoose');

const playlist = new mongoose.Schema({
  _id: String,
  songKick: String,
  playlistUri: String,
  songUris: Array,
  artistsPlayListed: Array,
  lastPlaylistUpdate: Date,
});

module.exports = mongoose.model('Playlist', playlist);
