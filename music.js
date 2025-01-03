import ytdl from "@distube/ytdl-core";
import Randomstring from "randomstring";
import YTMusic from "ytmusic-api"
import {createWriteStream, existsSync} from "fs"
import axios from "axios";

const getThumbnailBuffer = async (thumbnailUrl) => {
    try {
      const response = await axios.get(thumbnailUrl, {
        responseType: "arraybuffer",
      });

      const buffer = Buffer.from(response.data, "binary");
  
      console.log("Thumbnail buffer created!");
      return buffer;
    } catch (error) {
      console.error("Error fetching thumbnail:", error.message);
      return null;
    }
  };

const downloadSong = async (url, fileName) => {
    return new Promise((resolve, reject) => {
        const stream = ytdl(url, {
            quality: "highestaudio",
            filter: "audioonly",
        }).pipe(createWriteStream(fileName));
    
        stream
        .on("finish", () => resolve(true)) 
        .on("error", (error) => reject(error));
    })
}

export const music = async (search) => {
    try {
        const ytmusic = new YTMusic()
        await ytmusic.initialize()
        const songs = await ytmusic.search(search)
        const songId = songs[0]?.videoId;
        if (!songId || !songs[0]?.thumbnails[0]?.url) {
            console.log("No song found!");
            return false;
          }
        const thumbnail = await getThumbnailBuffer(songs[0].thumbnails[0].url)
        const fileName = `${songs[0].name.replace(/[^a-zA-Z0-9 ]/g, "").trim()}.mp3`
        if(existsSync(fileName)) {
            return {fileName, thumbnail}
        }

        await downloadSong(`http://www.youtube.com/watch?v=${songId}`, fileName)
        

        return {fileName, thumbnail}
    }
    catch(error) {
        console.log(error)
        return false
    }
}


export default music