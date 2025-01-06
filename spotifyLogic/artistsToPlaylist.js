import axios from "axios"

export default async function artistsToPlaylist(playlistId, artists) {
    axios.post(`http://localhost:8888/api/doit/${playlistId}`, { artists: artists })
}
