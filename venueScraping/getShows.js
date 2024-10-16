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
      return textsAndHrefs;
    });
  
    await browser.close();
  
    const filteredResults = results.filter(({ href }) => href !== null);
    showObj[venue].shows = filteredResults.map(({ text, href, readableTime }) => ( `${text} - ${readableTime} tickets:${href}`));
  
    const splitResults = filteredResults.flatMap(({ text, href, datetime, readableTime }) => 
      text.split(',').map(entry => ({ text: entry.trim(), href, datetime, readableTime }))
    );
    showObj[venue].artists = splitResults;
  
    console.log(`Artists at ${venue}`, showObj[venue].artists);
    return splitResults;
}

export default getShows;