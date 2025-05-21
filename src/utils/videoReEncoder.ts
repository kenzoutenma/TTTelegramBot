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

    return new Promise((resolve, reject) => {
        const filters: string[] = [];

        if (cropTop || cropBottom) {
            const botValue = Number(cropBottom);
            const topValue = Number(cropTop);
            const cropHeightExpr = `in_h-${topValue + botValue}`;
            filters.push(`crop=in_w:${cropHeightExpr}:0:${topValue}`);
        }

        filters.push("scale=trunc(iw/2)*2:trunc(ih/2)*2");

        let command = ffmpeg(inputPath)
            .output(outputPath)
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

        if (asGif) {
            command = command
                .format("gif")
                .outputOptions(["-vf", filters.join(","), "-r", "15"]);
        } else {
            command = command
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
                ]);
        }

        if (startTime) command = command.setStartTime(startTime);
        if (duration) command = command.setDuration(duration);

        command.run();
    });
}

interface reencodeToGif {
    buffer: Buffer;
    isGif: boolean;
    videoStartFrom?: number;
    videoEndTo?: number;
}

async function reencodeToGif({ buffer }: reencodeToGif) {}

export default { reencodeVideo, reencodeToGif };
