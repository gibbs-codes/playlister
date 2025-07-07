// src/config/venues.js
// Configuration-driven approach - easy to add new venues!

export const venues = [
  {
    id: 'sleeping-village',
    name: 'Sleeping Village',
    scrapeUrl: 'https://www.songkick.com/venues/3756109-sleeping-village/calendar',
    scrapingConfig: {
      type: 'songkick',
      artistSelector: 'strong', // CSS selector for artist names
      linkSelector: 'a', // CSS selector for event links
      dateSelector: 'time[datetime]', // CSS selector for dates // LLM will handle parsing
      fallbackTraditional: false
    }
  },
  {
    id: 'vic-theatre',
    name: 'The Vic Theatre',
    scrapeUrl: 'https://www.songkick.com/venues/2330824-vic/calendar',
    scrapingConfig: {
      type: 'songkick',
      artistSelector: 'strong', // CSS selector for artist names
      linkSelector: 'a', // CSS selector for event links
      dateSelector: 'time[datetime]', // CSS selector for dates
      fallbackTraditional: false
    }
  },
  {
    id: 'beat-kitchen',
    name: 'Beat Kitchen',
    scrapeUrl: 'https://www.songkick.com/venues/212-beat-kitchen/calendar',
    scrapingConfig: {
      type: 'songkick',
      artistSelector: 'strong', // CSS selector for artist names
      linkSelector: 'a', // CSS selector for event links
      dateSelector: 'time[datetime]', // CSS selector for dates
      fallbackTraditional: false
    }
  },
  {
    id: 'schubas',
    name: 'Schubas',
    scrapeUrl: 'https://www.songkick.com/venues/2133-schubas-tavern/calendar',
    scrapingConfig: {
      type: 'songkick',
      artistSelector: 'strong', // CSS selector for artist names
      linkSelector: 'a', // CSS selector for event links
      dateSelector: 'time[datetime]', // CSS selector for dates
      fallbackTraditional: false
    }
  },
  {
    id: 'metro-chicago',
    name: 'Metro',
    scrapeUrl: 'https://www.songkick.com/venues/1070-metro/calendar',
    scrapingConfig: {
      type: 'songkick',
      artistSelector: 'strong', // CSS selector for artist names
      linkSelector: 'a', // CSS selector for event links
      dateSelector: 'time[datetime]', // CSS selector for dates
      fallbackTraditional: false
    }
  },
  {
    id: 'chop-shop',
    name: 'Chop Shop',
    scrapeUrl: 'https://www.songkick.com/venues/3386364-chop-shop/calendar',
    scrapingConfig: {
      type: 'songkick',
      artistSelector: 'strong', // CSS selector for artist names
      linkSelector: 'a', // CSS selector for event links
      dateSelector: 'time[datetime]', // CSS selector for dates
      fallbackTraditional: false
    }
  }
];

// Helper to get venue by ID
export function getVenueConfig(venueId) {
  return venues.find(v => v.id === venueId);
}

// Helper to get all venue IDs
export function getAllVenueIds() {
  return venues.map(v => v.id);
}

// Helper to get venue count
export function getVenueCount() {
  return venues.length;
}