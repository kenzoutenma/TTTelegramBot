import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { readFile, writeFile } from "fs/promises";

import logger from "../logger";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function getCodec() {
  ffmpeg.getAvailableEncoders((err, encoders) => {
    console.log("getAvailableEncoders", encoders);
  });
}

/* 
	main block of encode video
*/
async function encodeVideo(
  buffer: Buffer,
  filters: filtered,
): Promise<{
  video: Buffer;
  thumbnail: Buffer;
  width?: number;
  height?: number;
}> {
  await writeFile(filters.input, buffer);
  console.log("\n\nparams filters:", filters.stringified);
  console.log(
    "\n\n\x1b[35mquality filters:",
    filters.stringifiedQuality,
    "\x1b[0m",
  );

  const opts = [
    "-movflags",
    "faststart",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    "-vf",
    `${filters.stringified.join(",")}`,
    ...filters.stringifiedQuality,
  ];

  if (filters.noAudio) opts.push("-an");

  console.log("processing video");
  const videoBuffer: Buffer = await new Promise((resolve, reject) => {
    let videoStarter = ffmpeg(filters.input)
      .output(filters.output)
      .videoFilters(filters.stringified)
      .videoCodec("libx264")
      .audioCodec("mp2")
      .outputOptions([
        "-movflags",
        "faststart",
        "-preset",
        "veryfast",
        "-pix_fmt",
        "yuv420p",
        ...filters.stringifiedQuality,
      ])
      .on("start", (commandLine) => {
        logger({ message: `FFmpeg started: ${commandLine}` });
      })
      .on("stderr", (stderrLine) => {})
      .on("error", (err) => {
        logger({ message: "FFmpeg error", error: err.message });
        reject(new Error("FFmpeg error: " + err.message));
      })
      .on("end", async () => {
        try {
          const resultBuffer = await readFile(filters.output);
          resolve(resultBuffer);
        } catch (e) {
          reject(e);
        }
      });

    if (filters.start) videoStarter = videoStarter.setStartTime(filters.start);
    if (filters.duration)
      videoStarter = videoStarter.setDuration(filters.duration);

    videoStarter.run();
  });

  console.log("processing thumb");
  const thumbPath = filters.output + "_thumb.jpg";
  const thumbnailBuffer = await new Promise<Buffer>((resolve, reject) => {
    ffmpeg(filters.output)
      .inputOptions(["-ss 00:00:00.500"])
      .outputOptions(["-vframes 1"])
      .output(thumbPath)
      .on("end", async () => {
        const res = await readFile(thumbPath);
        resolve(res);
      })
      .on("error", reject)
      .run();
  });

  console.log("processing dims");
  let dimension;
  try {
    dimension = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        ffmpeg.ffprobe(filters.output, (err, metadata) => {
          if (err) return reject(err);
          const videoStream = metadata.streams.find(
            (s) => s.codec_type === "video",
          );
          resolve({
            width: videoStream?.width || 0,
            height: videoStream?.height || 0,
          });
        });
      },
    );
  } catch (error) {
    dimension = {
      width: 720,
      height: 1280,
    };
  }

  return {
    video: videoBuffer,
    thumbnail: thumbnailBuffer,
    width: dimension.width,
    height: dimension.height,
  };
}

/* 
	main block of encode gif
*/
export async function encodeGIF(
  buffer: Buffer,
  filters: filtered,
): Promise<{ video: Buffer; thumbnail: Buffer }> {
  await writeFile(filters.input, buffer);
  const fpsList = [60, 45, 25, 20, 15, 10];

  for (const fps of fpsList) {
    console.log(`\n\nTrying FPS: ${fps}`);

    try {
      await runFFmpegGif(filters, fps);
      const resultBuffer = await readFile(filters.output);

      if (resultBuffer.byteLength < 10 * 1024 * 1024) {
        return { video: resultBuffer, thumbnail: resultBuffer };
      }
    } catch (err) {
      console.error("FFmpeg failed for FPS", fps, err);
    }
  }

  throw new Error("All FPS attempts failed or file too large");
}

/* 
	separated ffmpeg block for encode gif
*/
function runFFmpegGif(filters: filtered, fps: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(filters.input)
      .inputFormat("mp4")
      .output(filters.output)
      .outputOptions([
        "-vf",
        `fps=${fps},${filters.stringified.join(",")},scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3`,
      ])
      .format("gif")
      .on("error", (err) => reject(new Error("FFmpeg error: " + err.message)))
      .on("end", async () => {
        try {
          const resultBuffer = await readFile(filters.output);
          if (resultBuffer.byteLength < 10 * 1024 * 1024) {
            resolve(resultBuffer);
          } else {
            reject();
          }
        } catch (e) {
          reject(e);
        }
      });

    if (filters.start) command = command.setStartTime(filters.start);
    if (filters.duration) command = command.setDuration(filters.duration);

    command.run();
  });
}

export default { encodeGIF, encodeVideo };
