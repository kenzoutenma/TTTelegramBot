import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import logger, { textColor } from "./logger";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function reencodeVideo(
	buffer: Buffer,
	startTime?: string,
	duration?: string,
	cropTop?: string,
	cropBottom?: string,
	asGif?: boolean
): Promise<Buffer> {
	const date = Date.now();
	const inputPath = join(tmpdir(), `${date}_input.mp4`);
	const extension = asGif ? "gif" : "mp4";
	const outputPath = join(tmpdir(), `${date}_output.${extension}`);

	await writeFile(inputPath, buffer);

	const filters: string[] = [];

	if (cropTop || cropBottom) {
		const botValue = Number(cropBottom);
		const topValue = Number(cropTop);
		const cropHeightExpr = `in_h-${topValue + botValue}`;
		filters.push(`crop=in_w:${cropHeightExpr}:0:${topValue}`);
	}

	filters.push("scale=trunc(iw/2)*2:trunc(ih/2)*2");

	if (asGif) {
		const gifPath = `${outputPath}.gif`;
		try {
			await new Promise((res, rej) => {
				let gifStarter = ffmpeg(inputPath)
					.inputFormat("mp4")
					.output(gifPath)
					.outputOptions([
						"-filter_complex",
						`[0:v] ${filters[0]}, fps=10,scale=-1:-1:flags=full_chroma_int,split [a][b];[a] palettegen=max_colors=255:reserve_transparent=1:stats_mode=diff [p];[b][p] paletteuse=dither=none:bayer_scale=5:diff_mode=rectangle:new=1:alpha_threshold=128`,
						"-gifflags",
						"-offsetting",
					])
					.format("gif")
					.on("end", res)
					.on("error", rej);
				if (startTime) gifStarter = gifStarter.setStartTime(startTime);
				if (duration) gifStarter = gifStarter.setDuration(duration);
				gifStarter.run();
			});

			const resultBuffer = await readFile(gifPath);
			if (resultBuffer.byteLength < 10 * 1024 * 1024) {
				return resultBuffer;
			} else {
				logger({ message: `${resultBuffer.byteLength} < ${10 * 1024 * 1024}` });
			}
		} catch (err) {
			logger({
				message: `FFmpeg failed`,
				error: err instanceof Error ? err.message : String(err),
			});
		}

		throw new Error("Unable to create GIF under 10MB with acceptable FPS.");
	} else {
		return new Promise((resolve, reject) => {
			let videoStarter = ffmpeg(inputPath)
				.output(outputPath)
				.videoCodec("libx264")
				.audioCodec("aac")
				.outputOptions(["-movflags", "faststart", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-vf", filters.join(",")])
				.on("error", (err) => {
					logger({ message: "FFmpeg error", error: err.message });
					reject(new Error("FFmpeg error: " + err.message));
				})
				.on("end", async () => {
					try {
						const resultBuffer = await readFile(outputPath);
						resolve(resultBuffer);
					} catch (e) {
						reject(e);
					}
				});

			if (startTime) videoStarter = videoStarter.setStartTime(startTime);
			if (duration) videoStarter = videoStarter.setDuration(duration);

			videoStarter.run();
		});
	}
}

export default { reencodeVideo };
