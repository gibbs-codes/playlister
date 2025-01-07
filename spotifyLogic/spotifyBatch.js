import makeNewPlaylist from "./spotifyBatch";
import artistsToPlaylist from "./artistsToPlaylist";
import Venue from "../models/venue";

export default async function spotifyBatch() {
    const venues = await Venue.find();
    for (let venue of venues) {
        let playlistId = venue.playlistId || null;
        if (!playlistId){
            try {
                let playlistId = await makeNewPlaylist(venue);
                await Venue.findByIdAndUpdate(venue._id, {playlistId: playlistId}, {new: true})
            } catch (err) {
                console.log(err);
            }
        }
        try{
            await artistsToPlaylist(playlistId, venue.artistsComing);
            await Venue.findByIdAndUpdate(venue._id, {lastPlaylistUpdate: Date.now()}, {new: true})
        } catch (err) {
            console.log(err);
        }
    }
    return true;
}