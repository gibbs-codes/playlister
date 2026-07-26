// src/scrapers/base.js
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import LLMParser from './llm-parser.js';

class VenueScraper {
  constructor() {
    this.llmParser = new LLMParser();
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  // Songkick's bot protection 406s plain HTTP clients (axios/curl) on venue,
  // artist, and calendar pages even with a full browser header set - only a
  // real browser engine gets through. Fetch via headless Chromium instead.
  async fetchHtml(url) {
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({ userAgent: this.userAgent });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      return await page.content();
    } finally {
      await browser.close();
    }
  }

  async scrapeVenue(venueConfig) {
    console.log(`🎵 Scraping ${venueConfig.name}...`);

    try {
      // Fetch the HTML
      const html = await this.fetchHtml(venueConfig.scrapeUrl);
      console.log(`📄 Fetched ${html.length} characters from ${venueConfig.name}`);

      let artists = [];
      
      // Determine parsing strategy based on venue config
      if (venueConfig.scrapingConfig.type === 'generic') {
        // Go straight to LLM for real venue websites
        console.log('🤖 Using LLM parsing for real venue website...');
        artists = await this.llmParser.extractArtists(html, venueConfig.name);
      } else {
        // Try traditional parsing first (for SongKick, etc.)
        artists = this.parseTraditional(html, venueConfig.scrapingConfig);
        
        // If traditional parsing fails or finds few results, use LLM
        if (artists.length < 2) {
          console.log('🤖 Traditional parsing found few results, using LLM...');
          artists = await this.llmParser.extractArtists(html, venueConfig.name);
        }
      }

      console.log(`✅ Found ${artists.length} artists for ${venueConfig.name}`);
      return {
        venueId: venueConfig.id,
        venueName: venueConfig.name,
        artists: artists,
        scrapedAt: new Date(),
        method: artists.length >= 2 ? 'traditional' : 'llm'
      };

    } catch (error) {
      console.error(`❌ Error scraping ${venueConfig.name}:`, error.message);
      return {
        venueId: venueConfig.id,
        venueName: venueConfig.name,
        artists: [],
        scrapedAt: new Date(),
        error: error.message
      };
    }
  }

  // Traditional CSS selector parsing (works for well-structured sites like SongKick)
  parseTraditional(html, config) {
    const $ = cheerio.load(html);
    const artists = [];

    try {
      if (config.type === 'songkick') {
        // SongKick specific parsing
        $(config.artistSelector).each((i, element) => {
          const $el = $(element);
          const text = $el.text().trim();
          
          if (text && text.length > 0) {
            // Clean up common venue-specific formatting
            const cleaned = text
              .replace(/\s+/g, ' ') // Normalize whitespace
              .replace(/^(.*?)\s*\(.*\)$/, '$1') // Remove parenthetical info
              .trim();
            
            if (cleaned && !this.isVenueInfo(cleaned)) {
              artists.push(cleaned);
            }
          }
        });
      }

      return [...new Set(artists)]; // Remove duplicates
    } catch (error) {
      console.warn('Traditional parsing failed:', error.message);
      return [];
    }
  }

  // Filter out obvious venue/non-artist info
  isVenueInfo(text) {
    const venueKeywords = [
      'venue', 'location', 'address', 'tickets', 'buy', 'sold out',
      'doors', 'show', 'event', 'calendar', 'upcoming', 'past'
    ];
    
    const lowerText = text.toLowerCase();
    return venueKeywords.some(keyword => lowerText.includes(keyword)) ||
           text.length < 2 ||
           /^\d+/.test(text) || // Starts with numbers
           /^(mon|tue|wed|thu|fri|sat|sun)/i.test(text); // Starts with day names
  }

  // Scrape multiple venues in sequence (with delays to be polite)
  async scrapeMultipleVenues(venueConfigs, delayMs = 1000) {
    const results = [];
    
    for (const config of venueConfigs) {
      const result = await this.scrapeVenue(config);
      results.push(result);
      
      // Be polite to the servers
      if (delayMs > 0 && venueConfigs.length > 1) {
        console.log(`⏳ Waiting ${delayMs}ms before next venue...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }
}

export default VenueScraper;