import axios from 'axios';
import { getAccessToken } from '../auth/tokenStore.js';

async function removeTracksFromPlaylist(playlistId, trackUris) {
    const accessToken = getAccessToken();
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    // Spotify API requires removing tracks in batches of 100
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);
        const data = {
            tracks: batch.map(uri => ({ uri })),
        };

        try {
            await axios.delete(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                data,
            });
            console.log(`Removed ${batch.length} tracks from playlist ${playlistId}`);
        } catch (error) {
            console.error(`Error removing tracks from playlist ${playlistId}:`, error);
        }
    }
}

export default removeTracksFromPlaylist;