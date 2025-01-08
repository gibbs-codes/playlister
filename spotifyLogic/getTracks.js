import searchArtists from './searchArtists.js';
import getTopTracks from './getTopTracks.js';

async function getTracks(artistToFind) {
    const artist = await searchArtists(artistToFind);
    if (artist) {
        const topTracks = await getTopTracks(artist.id);
        const limitedTracks = topTracks.slice(0, 3); // Limit to 3 tracks
        const trackUris = limitedTracks.map(track => track.uri);
        return trackUris;
    }
}

export default getTracks;