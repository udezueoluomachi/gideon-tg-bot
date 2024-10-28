import YTMusic from "ytmusic-api";
import ytdl from "@distube/ytdl-core";
import fs from "fs"; // Required to manage file streams
import path from "path";
import { generate } from "randomstring";
import scrapeYouTubeData from "auto-youtube-scraper-data";

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
/*
    scrapeYouTubeData(videoId, ({po, visitor}) => {
      
    })
*/
    const {PO_TOKEN, VISITOR_DATA} = {
      PO_TOKEN : "MncnGdOz_nNUoiciIp-0WFtBT2y4I0mrob_G54piNeLkGXBEAaCltsEPAesTy-1_HDppCx4SWITGg7RdhySWrfvLGEBk4F72YJMobn-jafqXr1qt5go6GiuQZtusZGLmvgoo0BoaeHRLJViUEkhTCVqVmc55rYyrSg==",
      VISITOR_DATA : "CgtzUWl0cFlRMlVPYyjqkPu4BjIKCgJORxIEGgAgVQ%3D%3D",
    }
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36",
      "X-YouTube-Client-Name": "1",
      "X-YouTube-Client-Version": "2.20201021.03.00",
      "X-YouTube-Identity-Token": PO_TOKEN,
      "X-YouTube-Page-CL": "00000000",
      "X-YouTube-Page-Label": "youtube.ytfe.desktop_20201014_2_RC00",
      "X-YouTube-Device": "cbr",
      "X-YouTube-Utc-Offset": "0",
      "X-YouTube-Visitor-Data": VISITOR_DATA,
      Origin: "https://www.youtube.com",
      Referer: "https://www.youtube.com/",
    }


    const outputFilePath = `${songs[0].name}-${generate({length : 4})}.mp3`;

    const audioPath = path.join(
      process.cwd(),
      `${outputFilePath}`
    );

    const stream = ytdl(url, {
      quality: 'highestaudio',
      filter: "audioonly",
      headers
    })

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