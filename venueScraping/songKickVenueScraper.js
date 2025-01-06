import getShows from './getShows.js';
import Venue from '../models/venueModel.js';


async function getMonthlyVenueSongKick() {
  const venues = await Venue.find();
  const songKickList = venues.map((venue) => venue._id); 
  for (const venue of songKickList) {
    console.log(venue, 'artists!');
    await getShows(venue);
  }
  return true;
}

export default getMonthlyVenueSongKick;