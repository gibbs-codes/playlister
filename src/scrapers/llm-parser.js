// src/scrapers/llm-parser.js
import axios from 'axios';

class LLMParser {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.openaiKey = process.env.OPENAI_API_KEY;
  }

  // Primary parser using local Qwen
  async parseArtistsWithQwen(htmlContent, venueName = '') {
    const prompt = `Extract artist names from this venue listing HTML. Return ONLY a JSON array of artist names, cleaned and standardized. Remove any venue information, support acts in parentheses, or special formatting.

Venue: ${venueName}
HTML Content: ${htmlContent.slice(0, 3000)} // Truncate to avoid token limits

Requirements:
- Return only main headlining artists
- Clean up formatting (proper capitalization)  
- Remove text like "with special guests", venue info, etc.
- If you see "Artist A (with Artist B)", extract both separately
- Return empty array if no artists found

Response format: ["Artist Name 1", "Artist Name 2"]`;

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'qwen2.5',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for consistent parsing
          top_p: 0.9
        }
      });

      const result = response.data.response.trim();
      
      // Try to parse as JSON
      try {
        const artists = JSON.parse(result);
        if (Array.isArray(artists)) {
          return artists.filter(name => name && name.trim().length > 0);
        }
      } catch (parseError) {
        console.warn('Qwen returned non-JSON response, trying to extract manually');
        return this.extractArtistsFromText(result);
      }
      
      return [];
    } catch (error) {
      console.error('Qwen parsing failed:', error.message);
      return this.parseArtistsWithOpenAI(htmlContent, venueName);
    }
  }

  // Fallback parser using OpenAI
  async parseArtistsWithOpenAI(htmlContent, venueName = '') {
    if (!this.openaiKey) {
      console.warn('No OpenAI key available for fallback parsing');
      return [];
    }

    const prompt = `Extract artist names from this venue HTML. Return only a JSON array of clean artist names.

Venue: ${venueName}
HTML: ${htmlContent.slice(0, 2000)}

Return format: ["Artist 1", "Artist 2"]`;

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a precise HTML parser that extracts artist names and returns only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = response.data.choices[0].message.content.trim();
      const artists = JSON.parse(result);
      
      if (Array.isArray(artists)) {
        return artists.filter(name => name && name.trim().length > 0);
      }
      
      return [];
    } catch (error) {
      console.error('OpenAI parsing failed:', error.message);
      return [];
    }
  }

  // Manual extraction as last resort
  extractArtistsFromText(text) {
    // Look for patterns like ["Artist", "Artist"] or Artist names in quotes
    const patterns = [
      /\["([^"]+)"(?:,\s*"([^"]+)")*/g,
      /"([^"]+)"/g,
    ];

    const artists = [];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        for (let i = 1; i < match.length; i++) {
          if (match[i] && match[i].trim()) {
            artists.push(match[i].trim());
          }
        }
      }
    }

    return [...new Set(artists)]; // Remove duplicates
  }

  // Main parsing method - tries Qwen first, falls back to OpenAI
  async extractArtists(htmlContent, venueName = '') {
    console.log(`🤖 Parsing artists for ${venueName}...`);
    
    try {
      const artists = await this.parseArtistsWithQwen(htmlContent, venueName);
      
      if (artists.length > 0) {
        console.log(`✅ Qwen found ${artists.length} artists:`, artists);
        return artists;
      }
      
      console.log('🔄 Qwen found no artists, trying OpenAI fallback...');
      const fallbackArtists = await this.parseArtistsWithOpenAI(htmlContent, venueName);
      
      console.log(`✅ OpenAI found ${fallbackArtists.length} artists:`, fallbackArtists);
      return fallbackArtists;
      
    } catch (error) {
      console.error('❌ All parsing methods failed:', error);
      return [];
    }
  }
}

export default LLMParser;