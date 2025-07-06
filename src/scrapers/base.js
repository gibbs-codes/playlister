// src/scrapers/base.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import LLMParser from './llm-parser.js';

class VenueScraper {
  constructor() {
    this.llmParser = new LLMParser();
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  async scrapeVenue(venueConfig) {
    console.log(`🎵 Scraping ${venueConfig.name}...`);
    
    try {
      // Fetch the HTML
      const response = await axios.get(venueConfig.scrapeUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      });

      const html = response.data;
      console.log(`📄 Fetched ${html.length} characters from ${venueConfig.name}`);

      // Try traditional parsing first (faster)
      let artists = this.parseTraditional(html, venueConfig.scrapingConfig);
      
      // If traditional parsing fails or finds few results, use LLM
      if (artists.length < 2) {
        console.log('🤖 Traditional parsing found few results, using LLM...');
        artists = await this.llmParser.extractArtists(html, venueConfig.name);
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