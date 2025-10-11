import { tmpdir } from "os";
import { join } from "path";

const TELEGRAM_SAFE_LIMIT = 10 * 1024 * 1024 * 0.75;

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
	filters.push(`scale=720:-2:flags=lanczos`);

	console.log(options)
	if (options && options.length && options.length > TELEGRAM_SAFE_LIMIT) {
		const ratio = options.length / TELEGRAM_SAFE_LIMIT;
		const crf = Math.min(27 + Math.floor((ratio - 1) * 1.2), 30);
		const baseBitrateKbps = Math.max(800, Math.floor(1200 / ratio));
		quality.push(
			"-crf",
			crf.toString(),
			"-b:v",
			`${baseBitrateKbps}k`,
			"-maxrate",
			`${Math.round(baseBitrateKbps * 1.3)}k`,
			"-bufsize",
			`${Math.round(baseBitrateKbps * 2)}k`
		);
	}

	return {
		input: inputPath,
		output: outputPath,
		start: start || "0",
		duration: duration,
		stringified: filters,
		stringifiedQuality: quality,
		noAudio: noAudio,
	};
}
