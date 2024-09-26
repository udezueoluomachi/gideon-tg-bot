import YTMusic from "ytmusic-api";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs"; // Required to manage file streams

const API = new YTMusic();
await API.initialize(/* Optional: Custom cookies */);

export default async function music(search) {
  try {
    const songs = await API.search(search);

    if (!songs || songs.length === 0) {
      throw new Error("No songs found");
    }

    const url = `https://www.youtube.com/watch?v=${songs[0].videoId}`;

    // Cookie string you extracted from your browser
    const cookie = 'CONSENT=YES+; YSC=abcdefgh12345; VISITOR_INFO1_LIVE=xyz123abc;';

    const stream = ytdl(url, {
      quality: 'highestaudio',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Cookie': cookie, // Pass the YouTube cookie
        },
      },
    });

    const outputFilePath = `./${songs[0].videoId}.mp3`;

    ffmpeg(stream)
      .audioBitrate(128)
      .format('mp3')
      .on('end', () => {
        console.log('Download and conversion complete!');
      })
      .on('error', err => {
        console.error('Error occurred:', err);
      })
      .save(outputFilePath);

    return outputFilePath;
  } catch (error) {
    console.error("Error in music download:", error);
    return false;
  }
}

// Testing the music function
music("Lucid dream remix").then(result => {
  console.log(result ? `File saved: ${result}` : 'Download failed');
});
