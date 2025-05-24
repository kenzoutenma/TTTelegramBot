import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import logger from "./logger";
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
        const fpsOptions = [25, 20, 15, 12, 10, 8, 6];
        const paletteBasePath = `${outputPath}_palette`;

        for (const fps of fpsOptions) {
            const palettePath = `${paletteBasePath}_${fps}.png`;
            const gifPath = `${outputPath}_${fps}.gif`;

            try {
                await new Promise((res, rej) => {
                    ffmpeg(inputPath)
                        .output(palettePath)
                        .outputOptions([
                            "-vf",
                            `scale=240:-1:flags=lanczos,fps=${fps},palettegen`,
                        ])
                        .on("end", res)
                        .on("error", rej)
                        .run();
                });

                await new Promise((res, rej) => {
                    let gifStarter = ffmpeg(inputPath)
                        .input(palettePath)
                        .output(gifPath)
                        .outputOptions([
                            "-lavfi",
                            `scale=240:-1:flags=lanczos,fps=${fps} [x]; [x][1:v] paletteuse`,
                        ])
                        .format("gif")
                        .on("end", res)
                        .on("error", rej)
                    if (startTime) gifStarter = gifStarter.setStartTime(startTime);
                    if (duration) gifStarter = gifStarter.setDuration(duration);
                    gifStarter.run();
                });

                const resultBuffer = await readFile(gifPath);
                if (resultBuffer.byteLength < 10 * 1024 * 1024) {
                    return resultBuffer;
                }
            } catch (err) {
                logger({
                    message: `FFmpeg failed at ${fps} fps`,
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }

        throw new Error("Unable to create GIF under 10MB with acceptable FPS.");
    } else {
        return new Promise((resolve, reject) => {
            let videoStarter = ffmpeg(inputPath)
                .output(outputPath)
                .videoCodec("libx264")
                .audioCodec("aac")
                .outputOptions([
                    "-movflags",
                    "faststart",
                    "-preset",
                    "veryfast",
                    "-pix_fmt",
                    "yuv420p",
                    "-vf",
                    filters.join(","),
                ])
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
