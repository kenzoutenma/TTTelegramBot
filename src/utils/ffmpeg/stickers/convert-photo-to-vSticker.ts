import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import { PassThrough } from "stream";

export async function ConvertToWebm(
  path: string,
  fit?: boolean,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const outputStream = new PassThrough();

    const command = ffmpeg(path);

    if (!path.endsWith(".mp4")) {
      command.inputOptions(["-loop 1"]);
    }

    const vf = fit
      ? "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=yuva420p"
      : "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,format=yuv420p";

    command
      .inputOptions(["-t 3"])
      .outputOptions([
        "-vf",
        vf,
        "-c:v libvpx-vp9",
        "-pix_fmt yuva420p",
        "-crf 30",
        "-b:v 0",
        "-an",
      ])
      .format("webm")
      .on("error", async (err) => {
        try {
          await fs.unlink(path);
        } catch (e) {}
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
