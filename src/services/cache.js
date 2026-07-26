// src/services/cache.js
// Local JSON-file store. Replaces the old MongoDB Atlas-backed cache -
// that cluster (projectz.ovb3i.mongodb.net) no longer resolves and the
// cached data itself was disposable, so there was no reason to keep an
// external DB dependency for a single-instance homelab app.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.CACHE_DATA_DIR || path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'cache.json');

const emptyStore = () => ({ venues: {}, artists: {}, tokens: {} });

class CacheService {
  constructor() {
    this.store = null;
  }

  async load() {
    if (this.store) return this.store;

    try {
      const raw = await fs.readFile(DATA_FILE, 'utf-8');
      this.store = JSON.parse(raw);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('❌ Failed to read cache file, starting fresh:', error.message);
      }
      this.store = emptyStore();
    }

    return this.store;
  }

  async save() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(this.store, null, 2));
  }

  // Token management
  async saveSpotifyTokens(accessToken, refreshToken, expiresIn) {
    const store = await this.load();
    store.tokens.spotify = {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      lastUpdated: new Date().toISOString()
    };
    await this.save();
  }

  async getSpotifyTokens() {
    const store = await this.load();
    const tokens = store.tokens.spotify;
    if (!tokens) return null;
    return { ...tokens, expiresAt: new Date(tokens.expiresAt) };
  }

  // Venue management
  async saveVenue(venueData) {
    const store = await this.load();
    store.venues[venueData.id] = { ...store.venues[venueData.id], ...venueData };
    await this.save();
    return store.venues[venueData.id];
  }

  async getVenue(venueId) {
    const store = await this.load();
    const venue = store.venues[venueId];
    if (!venue) return null;
    return { ...venue, lastScraped: venue.lastScraped ? new Date(venue.lastScraped) : null };
  }

  async getAllVenues() {
    const store = await this.load();
    return Object.values(store.venues).map(venue => ({
      ...venue,
      lastScraped: venue.lastScraped ? new Date(venue.lastScraped) : null
    }));
  }

  async updateVenuePlaylist(venueId, playlistId) {
    const store = await this.load();
    store.venues[venueId] = { ...store.venues[venueId], id: venueId, playlistId };
    await this.save();
    return store.venues[venueId];
  }

  async updateVenuePreviousArtists(venueId, artists) {
    const store = await this.load();
    store.venues[venueId] = {
      ...store.venues[venueId],
      id: venueId,
      previousArtists: artists,
      lastScraped: new Date().toISOString()
    };
    await this.save();
    return store.venues[venueId];
  }

  // Remove artist from global cache
  async removeArtist(name) {
    const store = await this.load();
    const existed = store.artists[name];
    delete store.artists[name];
    await this.save();
    return existed || null;
  }

  // Artist management
  async saveArtist(artistData) {
    const store = await this.load();
    store.artists[artistData.name] = {
      ...artistData,
      lastSpotifyCheck: new Date().toISOString()
    };
    await this.save();
    return store.artists[artistData.name];
  }

  async getArtist(name) {
    const store = await this.load();
    const artist = store.artists[name];
    if (!artist) return null;
    return { ...artist, lastSpotifyCheck: new Date(artist.lastSpotifyCheck) };
  }

  async getStaleArtists(daysSinceCheck = 7) {
    const store = await this.load();
    const cutoff = Date.now() - daysSinceCheck * 24 * 60 * 60 * 1000;
    return Object.values(store.artists)
      .filter(artist => new Date(artist.lastSpotifyCheck).getTime() < cutoff)
      .map(artist => ({ ...artist, lastSpotifyCheck: new Date(artist.lastSpotifyCheck) }));
  }
}

export default CacheService;
