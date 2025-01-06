import axios from "axios";

export default async function makeNewPlaylist(venueName) {
    axios.post(`http://localhost:8888/api/playlist`, { venue: venueName }).then((res) => {
        console.log(res.data);
        return res.data;
    }).catch((err) => {
        console.log(err);
    });
}