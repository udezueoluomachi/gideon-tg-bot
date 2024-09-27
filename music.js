import YTMusic from "ytmusic-api";
import ytdl from "@distube/ytdl-core";
import fs from "fs"; // Required to manage file streams
import path from "path";
import { generate } from "randomstring";

const API = new YTMusic();
await API.initialize(/* Optional: Custom cookies */);

const agent = ytdl.createAgent(JSON.parse(fs.readFileSync("cookies.json")))

export default async function music(search, callback) {
  try {
    const songs = await API.search(search);

    if (!songs || songs.length === 0) {
     return callback("No songs found");
    }
    
    const url = `https://www.youtube.com/watch?v=${songs[0].videoId}`;

    const headers = {
      'X-YouTube-Client-Name': '5',
      'X-YouTube-Client-Version': '19.09.3',
      Origin: 'https://www.youtube.com',
      'User-Agent': 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)',
      'content-type': 'application/json'
    }


    const outputFilePath = `${songs[0].name}-${generate({length : 4})}.mp3`;

    const audioPath = path.join(
      process.cwd(),
      `${outputFilePath}`
    );

    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: "audioonly",
      headers,
      agent
    })

    const audioOutput = fs.createWriteStream(audioPath);

    stream.pipe(audioOutput)

    audioOutput.on("error", (err) => {
      console.error("File stream error:", err);
      return callback(false);
    });
    
    audioOutput.on("finish", () => {
      console.log("Download finished:", audioPath);
      return callback(audioPath, songs[0]);
    });
    
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      return callback(false);
    });
    
  } catch (error) {
    console.error("Error in music download:", error);
    return callback(false)
  }
}