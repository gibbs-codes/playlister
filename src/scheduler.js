// src/scheduler.js
import cron from 'node-cron';
import PlaylistBuilder from './services/playlist.js';

class PlaylistScheduler {
  constructor() {
    this.playlistBuilder = new PlaylistBuilder();
    this.isRunning = false;
  }

  // Start the weekly cron job
  start() {
    console.log('⏰ Starting playlist scheduler...');
    
    // Run every Sunday at 2 AM
    // Format: second minute hour day-of-month month day-of-week
    const cronExpression = '0 0 2 * * 0'; // Sunday at 2:00 AM
    
    cron.schedule(cronExpression, async () => {
      if (this.isRunning) {
        console.log('⚠️ Previous update still running, skipping...');
        return;
      }

      console.log(`\n🕐 ${new Date().toISOString()} - Starting scheduled playlist update`);
      this.isRunning = true;
      
      try {
        const results = await this.playlistBuilder.updateAllVenues();
        console.log('✅ Scheduled update completed successfully');
        console.log(`📊 Results: ${results.successful}/${results.totalVenues} venues updated`);
      } catch (error) {
        console.error('❌ Scheduled update failed:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('✅ Weekly scheduler started (Sundays at 2:00 AM)');
    
    // For testing - also allow manual trigger via environment
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development mode: Use /api/update-playlists to trigger manually');
    }
  }

  // Manual trigger (for testing)
  async runNow() {
    if (this.isRunning) {
      throw new Error('Update already in progress');
    }

    console.log('🚀 Manual playlist update triggered');
    this.isRunning = true;
    
    try {
      const results = await this.playlistBuilder.updateAllVenues();
      return results;
    } finally {
      this.isRunning = false;
    }
  }

  // Test a single venue
  async testVenue(venueId) {
    return await this.playlistBuilder.testVenue(venueId);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: 'Sundays at 2:00 AM',
      environment: process.env.NODE_ENV || 'production'
    };
  }
}

export default PlaylistScheduler;

// Add these routes to your main server file (src/index.js)
/*

// Add these imports to your src/index.js:
import PlaylistScheduler from './scheduler.js';
import PlaylistBuilder from './services/playlist.js';

// Add these after your existing routes:
const scheduler = new PlaylistScheduler();
const playlistBuilder = new PlaylistBuilder();

// Start the scheduler
scheduler.start();

// API Routes for manual control
app.get('/api/status', (req, res) => {
  res.json({
    scheduler: scheduler.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// Manual trigger for all playlists
app.post('/api/update-playlists', async (req, res) => {
  try {
    const results = await scheduler.runNow();
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Test a single venue
app.post('/api/test-venue/:venueId', async (req, res) => {
  try {
    const result = await scheduler.testVenue(req.params.venueId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all venues and their status
app.get('/api/venues', async (req, res) => {
  try {
    const cache = new CacheService();
    const venues = await cache.getAllVenues();
    res.json(venues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

*/