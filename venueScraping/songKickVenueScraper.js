import getTracks from '../spotifyLogic/getTracks.js';
import playlistCheck from '../spotifyLogic/playlistCheck.js';
import addTracksToPlaylist from '../spotifyLogic/addTracksToPlaylist.js';
import showObj from './showObj.js';
import getShows from './getShows.js';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMonthlyVenueSongKick() {
  let venues = Object.keys(showObj);
  for (const venue of venues) {
    console.log(venue, 'artists!');
    await getShows(venue);
  }
  for (const venue of venues) {
    let playlist = await playlistCheck(`Upcoming at ${showObj[venue].name}`, `Upcoming at ${showObj[venue].name}`, showObj[venue].name);
    showObj[venue].playlist = playlist;

    for (const artist of showObj[venue].artists) {
      const tracks = await getTracks(artist.text);
      showObj[venue].songs.push(tracks);
    }

    addTracksToPlaylist(showObj[venue].playlist, showObj[venue].songs.flat());
    console.log('delaying for 5 seconds');
    delay(5000);
  }
}

export default getMonthlyVenueSongKick;