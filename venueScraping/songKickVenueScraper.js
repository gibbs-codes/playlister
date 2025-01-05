import showObj from './showObj.js';
import getShows from './getShows.js';


async function getMonthlyVenueSongKick() {
  let venues = Object.keys(showObj);
  for (const venue of venues) {
    console.log(venue, 'artists!');
    await getShows(venue);
  }
}

export default getMonthlyVenueSongKick;