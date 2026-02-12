import { tmpdir } from "os";
import { join } from "path";

const TELEGRAM_SAFE_LIMIT = 10 * 1024 * 1024 * 0.75;

const seconds_to_time = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
};

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
export function ffmpeg_filters({ extension, cropTop, cropBottom, start, duration, noAudio, options }: filterIn): filtered {
	const date = Date.now();
	const inputPath = join(tmpdir(), `${date}_input.mp4`);
	const outputPath = join(tmpdir(), `${date}_output.${extension}`);

	const filters: string[] = [];
	const quality: string[] = [];

	const botValue = cropBottom ? Number(cropBottom) : 0;
	const topValue = cropTop ? Number(cropTop) : 0;

	const outHeight = topValue + botValue;
	const offsetY = topValue;

	filters.push(`crop=in_w:in_h-${outHeight}:0:${offsetY}`);

	if (options && options.length && options.length > TELEGRAM_SAFE_LIMIT) {
		const ratio = options.length / TELEGRAM_SAFE_LIMIT;
		const crf = Math.min(32, Math.max(24, Math.floor(32 + (ratio - 1) * 6)));
		console.log('\n\n', crf)
		const baseBitrateKbps = Math.max(350, Math.floor(1400 / Math.pow(ratio, 1.15)));
		const maxrate = Math.floor(baseBitrateKbps * 1.3);
		const bufsize = Math.floor(baseBitrateKbps * 2.0);
		quality.push("-crf", crf.toString(), "-b:v", `${baseBitrateKbps}k`, "-maxrate", `${maxrate}k`, "-bufsize", `${bufsize}k`);
		if (ratio >= 3) {
			filters.push(`scale=480:-2:flags=lanczos`);
		} else {
			filters.push(`scale=560:-2:flags=lanczos`);
		}
	} else {
		filters.push(`scale=720:-2:flags=lanczos`);
	}

	const start_crop = start && Number(start) > 60 ? seconds_to_time(Number(start)) : start;

	const data = {
		input: inputPath,
		output: outputPath,
		start: start_crop || "0",
		duration: duration,
		stringified: filters,
		stringifiedQuality: quality,
		noAudio: noAudio,
	}

	console.log(data)

	return data;
}
