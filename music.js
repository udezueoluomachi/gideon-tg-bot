import fs from "fs";
import path from "path";
import { generate } from "randomstring";
import SpotifySearch from 'spotify-finder'
import Spotify from 'spotifydl-core'
import axios from "axios";

const credentials = {
  clientId : process.env.CLIENT_ID,
  clientSecret : process.env.CLIENT_SECRET
}

const client = new SpotifySearch({
  consumer : {
    key : process.env.CLIENT_ID,
    secret : process.env.CLIENT_SECRET
  }
})
const spotify = new Spotify.default(credentials)

export default async function music(search, callback) {
  try {
    const songs = await client.search({
      q : search,
      type : "track",
      limit : 5
    });
    if(!songs || songs.tracks.items.length === 0)
      return callback("No songs found");

    
    const outputFilePath = `${songs.tracks.items[0].name}-(${generate({length : 4})})`;
    const url = songs.tracks.items[0].external_urls.spotify 

    const thumbResponse = await axios.get(songs.tracks.items[0].album.images[0].url, { responseType: 'arraybuffer' });
    const thumbBuffer = Buffer.from(thumbResponse.data);

    const audioPath = path.join(
      process.cwd(),
      `${outputFilePath}`
    );

    await spotify.downloadTrack(url, audioPath)

    return callback(outputFilePath, thumbBuffer)

  } catch (error) {
    console.error("Error in music download:", error);
    return callback(false)
  }
}