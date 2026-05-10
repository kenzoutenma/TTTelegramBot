import { tmpdir } from "os";
import { join } from "path";

const TELEGRAM_SAFE_LIMIT = 10 * 1024 * 1024;

/**
 * Generates ffmpeg filters and video data.
 *
 * @param {"gif" | "mp4" | "jpg"} extension - The output file extension/format.
 * @param {string} cropTop - Number of pixels to crop from the top.
 * @param {string} cropBottom - Number of pixels to crop from the bottom.
 * @param {string | undefined} start - Start time for trimming (e.g., in seconds or ffmpeg time format).
 * @param {string | undefined} duration - Duration of the trimmed video segment in seconds.
 * @param {boolean | undefined} noAudio - Whether to exclude audio from the output.
 * @param {{ length: number } | undefined} options - Extra video metadata (e.g., file size in bytes).
 * @returns {filtered} The generated filter configuration and paths.
 */
export function ffmpeg_filters({
  extension,
  cropTop,
  cropBottom,
  start,
  duration,
  noAudio,
  options,
}: filterIn): filtered {
  const date = Date.now();

  const filters: string[] = [];
  const quality: string[] = [];

  const botValue = cropBottom ? Number(cropBottom) : 0;
  const topValue = cropTop ? Number(cropTop) : 0;

  filters.push(`crop=in_w:in_h-${topValue + botValue}:0:${topValue}`);
  filters.push(`scale=720:-2:flags=lanczos`);

  console.log(`${options.length / 1024 / 1024}mb`);
  if (options.length / 1024 / 1024 < TELEGRAM_SAFE_LIMIT) {
    const data = {
      input: join(tmpdir(), `${date}_input.mp4`),
      output: join(tmpdir(), `${date}_output.${extension}`),
      start: start || "0",
      duration: duration,
      stringified: filters,
      stringifiedQuality: quality,
      noAudio: noAudio,
      fit: true,
    };
    return data;
  }

  const ratio = options.length / TELEGRAM_SAFE_LIMIT;
  const state = 2.5;
  console.log("RATIO: ", ratio, ratio * state);

  const crf = Math.max(20 + Math.floor(ratio * state), 25);
  console.log("CRF: ", crf);
  quality.push("-crf", crf.toString());

  const data = {
    input: join(tmpdir(), `${date}_input.mp4`),
    output: join(tmpdir(), `${date}_output.${extension}`),
    start: start || "0",
    duration: duration,
    stringified: filters,
    stringifiedQuality: quality,
    noAudio: noAudio,
  };

  return data;
}
