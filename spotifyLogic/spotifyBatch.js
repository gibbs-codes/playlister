import Venue from "../models/venueModel.js";
import playlistCheck from "./playlistCheck.js";
import getTracks from "./getTracks.js";
import addTracksToPlaylist from "./addTracksToPlaylist.js";
import { getAccessToken } from "../auth/tokenStore.js";
import login from "../auth/login.js";
import { set } from "mongoose";

export default async function spotifyBatch() {
    let token = getAccessToken();
    if (!token) {
        let loggedIn = await login();
        await setTimeout(() => {}, 100);
        if (loggedIn) {
            token = getAccessToken();
            if (!token) {
                console.log('Error logging in');
                return 'Error logging in';
            }
        } else {
            console.log('Error logging in');
            return 'Error logging in';
        }
    }


    const venues = await Venue.find();
    for (let venue of venues) {
        let playlistId = venue.playlistId || null;
        if (!playlistId){
            try {
                playlistId = await playlistCheck(`Upcoming|${venue.venueName}`, `Upcoming at ${venue.venueName}`)
                await Venue.findByIdAndUpdate(venue._id, {playlistId: playlistId}, {new: true})
            } catch (err) {
                console.log(err);
            }
        }
        try{
            let songs = [];
            for (const artist of venue.artistsComing) {
                const tracks = await getTracks(artist);
                songs.push(tracks);
            }
            await addTracksToPlaylist(playlistId, songs.flat());
            await Venue.findByIdAndUpdate(venue._id, {lastPlaylistUpdate: Date.now()}, {new: true});
            await setTimeout(() => {}, 1000);
        } catch (err) {
            console.log(err);
        }
    }
    return true;
}