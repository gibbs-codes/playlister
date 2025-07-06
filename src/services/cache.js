// src/services/cache.js
import mongoose from 'mongoose';

// Simplified schemas - just what you actually need
const venueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  scrapeUrl: { type: String, required: true },
  playlistId: String,
  lastScraped: { type: Date, default: Date.now },
  scrapingConfig: {
    type: Object,
    default: {}
  }
});

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  spotifyId: String,
  topTracks: [String], // Array of Spotify URIs
  lastSpotifyCheck: { type: Date, default: Date.now },
  popularity: Number
});

const tokenSchema = new mongoose.Schema({
  service: { type: String, required: true, unique: true }, // 'spotify'
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
  lastUpdated: { type: Date, default: Date.now }
});

const Venue = mongoose.model('Venue', venueSchema);
const Artist = mongoose.model('Artist', artistSchema);
const Token = mongoose.model('Token', tokenSchema);

class CacheService {
  constructor() {
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;
    
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB');
      this.connected = true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  // Token management
  async saveSpotifyTokens(accessToken, refreshToken, expiresIn) {
    await this.connect();
    
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));
    
    await Token.findOneAndUpdate(
      { service: 'spotify' },
      { 
        accessToken, 
        refreshToken, 
        expiresAt,
        lastUpdated: new Date()
      },
      { upsert: true }
    );
  }

  async getSpotifyTokens() {
    await this.connect();
    return await Token.findOne({ service: 'spotify' });
  }

  // Venue management
  async saveVenue(venueData) {
    await this.connect();
    return await Venue.findOneAndUpdate(
      { id: venueData.id },
      venueData,
      { upsert: true, new: true }
    );
  }

  async getVenue(venueId) {
    await this.connect();
    return await Venue.findOne({ id: venueId });
  }

  async getAllVenues() {
    await this.connect();
    return await Venue.find();
  }

  async updateVenuePlaylist(venueId, playlistId) {
    await this.connect();
    return await Venue.findOneAndUpdate(
      { id: venueId },
      { playlistId },
      { new: true }
    );
  }

  // Artist management  
  async saveArtist(artistData) {
    await this.connect();
    return await Artist.findOneAndUpdate(
      { name: artistData.name },
      { ...artistData, lastSpotifyCheck: new Date() },
      { upsert: true, new: true }
    );
  }

  async getArtist(name) {
    await this.connect();
    return await Artist.findOne({ name });
  }

  async getStaleArtists(daysSinceCheck = 7) {
    await this.connect();
    const cutoff = new Date(Date.now() - (daysSinceCheck * 24 * 60 * 60 * 1000));
    return await Artist.find({ 
      lastSpotifyCheck: { $lt: cutoff } 
    });
  }
}

export default CacheService;