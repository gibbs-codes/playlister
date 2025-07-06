// src/config/venues.js
// Configuration-driven approach - easy to add new venues!

export const venues = [
  {
    id: 'sleeping-village',
    name: 'Sleeping Village',
    scrapeUrl: 'https://www.songkick.com/venues/3756109-sleeping-village/calendar',
    scrapingConfig: {
      type: 'songkick', // We'll support multiple types later
      artistSelector: 'strong', // CSS selector for artist names
      linkSelector: 'a', // CSS selector for event links
      dateSelector: 'time[datetime]' // CSS selector for dates
    }
  },
  // Add more venues here as you expand
  // {
  //   id: 'metro-chicago',
  //   name: 'Metro',
  //   scrapeUrl: 'https://www.songkick.com/venues/1070-metro/calendar',
  //   scrapingConfig: {
  //     type: 'songkick',
  //     artistSelector: 'strong',
  //     linkSelector: 'a',
  //     dateSelector: 'time[datetime]'
  //   }
  // }
];

// Helper to get venue by ID
export function getVenueConfig(venueId) {
  return venues.find(v => v.id === venueId);
}

// Helper to get all venue IDs
export function getAllVenueIds() {
  return venues.map(v => v.id);
}