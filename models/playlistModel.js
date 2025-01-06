const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  _id: String,
  venue: String,
  playlistUri: String,
  songUris: Array,
  artistsPlayListed: Array,
  lastPlaylistUpdate: { type: Date, default: Date.now },
});

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;