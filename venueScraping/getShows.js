import puppeteer from 'puppeteer';
import Show from '../models/showModel.js';
import Venue from '../models/venueModel.js';


const createMultipleShows = async (showsToAdd) => {
  try {
    const shows = [];
    for (let showDetails of showsToAdd) {
      console.log(showDetails)
      const singleShow = new Show(showDetails);
      await singleShow.save();
      shows.push(singleShow);
    }
    console.log(`${shows.length} shows successfully created.`);
    return shows;
  } catch (err) {
    console.log("Error creating users:", err);
    return [];
  }
};

async function getShows(venue) {
    const url = `https://www.songkick.com/venues/${venue}/calendar`;
    const browser = await puppeteer.launch({
      headless: true, // Run in headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Disable sandboxing
      //executablePath: '/usr/bin/chromium', // first try
      // executablePath: '/usr/bin/chromium-browser', // second try
      executablePath: '/app/.apt/usr/bin/chromium', // third try    
      });
    const page = await browser.newPage();
  
    await page.goto(url, { waitUntil: 'networkidle2' });
  
    const results = await page.evaluate(() => {
      const strongTags = Array.from(document.querySelectorAll('strong'));
      const textsAndHrefs = strongTags.map(tag => {
        const text = tag.innerText;
        const href = tag.closest('a') ? tag.closest('a').href : null;
        const timeTag = tag.closest('li') ? tag.closest('li').querySelector('time') : null;
        const datetime = timeTag ? timeTag.getAttribute('datetime') : null;
        const readableTime = datetime ? new Date(datetime).toLocaleString() : null;
        return { text, href, datetime, readableTime };
      });
      console.log(textsAndHrefs)
      return textsAndHrefs;
    });
  
    await browser.close();
  
    const filteredResults = results.filter(({ href }) => href !== null);

    let shows = filteredResults.map(({ text, href, datetime, readableTime }) => ({ venue: venue, artist: text, concertDate: datetime, concertTime: readableTime, linkToBuyTickets: href}));
    await createMultipleShows(shows);
    let artistsToAdd = filteredResults.map(({ text, href, datetime, readableTime }) => (text));

    console.log(artistsToAdd)
    const updatedVenue = await Venue.findByIdAndUpdate(venue, {artistsComing: artistsToAdd, lastScraped: Date.now() }, {new: true})

}

export default getShows;