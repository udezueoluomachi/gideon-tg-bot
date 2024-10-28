import YTMusic from "ytmusic-api";
import fs from "fs"; // Required to manage file streams
import path from "path";
import { generate } from "randomstring";
import { stream as Stream } from "play-dl";

const API = new YTMusic();
await API.initialize(/* Optional: Custom cookies */);


export default async function music(search, callback) {
  try {
    const songs = await API.search(search);

    if (!songs || songs.length === 0) {
     return callback("No songs found");
    }

    const videoId = songs[0].videoId
    
    const url = `https://www.youtube.com/watch?v=${songs[0].videoId}`;


    const outputFilePath = `${songs[0].name}-${generate({length : 4})}.mp3`;

    const audioPath = path.join(
      process.cwd(),
      `${outputFilePath}`
    );

    const {stream} = (await Stream(url))

    const audioOutput = fs.createWriteStream(audioPath);

    stream.pipe(audioOutput)

    audioOutput.on("error", (err) => {
      console.error("File stream error:", err);
      fs.unlink(outputFilePath, (err) => {
        if (err) {
          return;
        }
      });
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