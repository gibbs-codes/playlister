import getUserPlaylists from './getUserPlaylists.js';
import createPlaylist from './createPlaylist.js';
import getPlaylistTracks from './getPlaylistTracks.js';
import removeTracksFromPlaylist from './removeTracksFromPlaylist.js';


async function playlistCheck(userPlaylistName, userPlaylistDescription){
    const playlistName = userPlaylistName;
    const userPlaylists = await getUserPlaylists();
    let playlist = userPlaylists.find(pl => pl.name === playlistName);
    let playlistId = playlist ? playlist.id : null;

    if (playlist) {
        const currentTrackUris = await getPlaylistTracks(playlist.id);
        await removeTracksFromPlaylist(playlist.id, currentTrackUris);
    } else {
        const playlistDescription = userPlaylistDescription;
        playlistId = await createPlaylist(playlistName, playlistDescription);
    }
    return playlistId;
}

export default playlistCheck;