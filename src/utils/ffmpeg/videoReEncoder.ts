import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { readFile, writeFile } from "fs/promises";

import logger from "../logger";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/* 
	main block of encode video
*/
async function encodeVideo(buffer: Buffer, filters: filtered): Promise<Buffer> {
	await writeFile(filters.input, buffer);
	console.log("\n\nparams filters:", filters.stringified)
	console.log("\n\nquality filters:", filters.stringifiedQuality)

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

	return new Promise((resolve, reject) => {
		let videoStarter = ffmpeg(filters.input)
			.output(filters.output)
			.videoCodec("libx265")
			.audioCodec("mp2")
			.outputOptions(opts)
			.on("start", (commandLine) => {
				logger({ message: `FFmpeg started: ${commandLine}` });
			})
			.on("stderr", (stderrLine) => {
				logger({ message: `"FFmpeg stderr" ${stderrLine}` });
			})
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
		if (filters.duration) videoStarter = videoStarter.setDuration(filters.duration);

		videoStarter.run();
	});
}

/* 
	main block of encode gif
*/
export async function encodeGIF(buffer: Buffer, filters: filtered): Promise<Buffer> {
	await writeFile(filters.input, buffer);
	const fpsList = [60, 45, 25, 20, 15, 10];

	for (const fps of fpsList) {
		console.log(`\n\nTrying FPS: ${fps}`);

		try {
			await runFFmpegGif(filters, fps);
			const resultBuffer = await readFile(filters.output);

			if (resultBuffer.byteLength < 10 * 1024 * 1024) {
				return resultBuffer;
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
				`fps=${fps},scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse,${filters.stringified.join(
					","
				)}`,
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
