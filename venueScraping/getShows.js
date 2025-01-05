import puppeteer from 'puppeteer';
import showObj from './showObj.js';

async function getShows(venue) {
    const url = `https://www.songkick.com/venues/${venue}/calendar`;
    const browser = await puppeteer.launch();
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

    let shows = filteredResults.map(({ text, href, datetime, readableTime }) => ({songKick: venue, venueName: venue, concertDate: datetime, concertTime: readableTime, linkToBuyTickets: href}));
    
    const artists = filteredResults.flatMap(({ text, href, datetime, readableTime }) => 
      text.split(',').map(entry => ({ text: entry.trim(), href, datetime, readableTime }))
    );

    showObj[venue].artists = artists;

    let venue = {songKick: venue, venueName: venue, artistsComing: artists, lastScraped: new Date()};
    
    // need to do 2 things here: put the venue, and add the shows
}

export default getShows;