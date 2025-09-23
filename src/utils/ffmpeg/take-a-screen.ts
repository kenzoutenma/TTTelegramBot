import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";
/**
 * Takes a preview snapshot from a video buffer.
 * @param buffer The video buffer to process.
 * @param filters The filters to apply to the video.
 * @returns A promise that resolves to the preview image buffer.
 */
export async function takePreview(buffer: Buffer, filters: filtered): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const inputStream = new PassThrough();
        inputStream.end(buffer);

        const chunks: Buffer[] = [];

        let command = ffmpeg(inputStream)
            .inputFormat("mp4") // adjust depending on input format
            .outputOptions([
                "-vf",
                `${filters.stringified.join(",")},scale=320:-2:flags=lanczos`,
                "-frames:v",
                "1"
            ])
            .format("image2")
            .on("error", (err) => reject(new Error("FFmpeg error: " + err.message)))
            .on("end", () => {
                resolve(Buffer.concat(chunks));
            })
            .pipe();

        command.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });
    });
}
