import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
import fs from "fs/promises";

export async function ConvertToWebp(path: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const outputStream = new PassThrough();

        ffmpeg(path)
            .outputOptions([
                "-vf", "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2",
                "-vframes", "1"
            ])
            .format("webp")
            .on("error", async (err) => {
                try { await fs.unlink(path); } catch (e) { }
                reject(new Error("FFmpeg error: " + err.message));
            })
            .on("end", async () => {
                try {
                    const result = Buffer.concat(chunks);
                    await fs.unlink(path);
                    resolve(result);
                } catch (err) {
                    reject(new Error("Failed to delete file: "));
                }
            })
            .pipe(outputStream);

        outputStream.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });
    });
}
