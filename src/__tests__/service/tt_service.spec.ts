import VideoEncodeClass from "#/service/video-encode";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tiktokVideo, TT_Service, userID } from "#/configs/test-config";

let buffer: Buffer<ArrayBufferLike> | undefined;

describe("TT", () => {
	it(
		"should return video in buffer",
		async () => {
			buffer = await TT_Service.captureVideoRequests(tiktokVideo());
			expect(typeof buffer).toBe("object");
		},
		60 * 1000
	);
	it(
		"should save video in folder",
		async () => {
			if (!buffer) return;

			const outputPath = join(process.cwd(), "test_output.mp4");
			console.log("CWD:", process.cwd());

			const encoder = new VideoEncodeClass({ videoBuffer: buffer, chatId: userID() });
			try {
				const encodeVideo = await encoder.downloadVideo();
				console.log("Encoded video:", encodeVideo);
				console.log("Is buffer:", Buffer.isBuffer(encodeVideo.video));

				expect(Buffer.isBuffer(encodeVideo.video)).toBe(true);

				if (encodeVideo && Buffer.isBuffer(encodeVideo.video)) {
					await writeFile(outputPath, encodeVideo.video);
					console.log("Video saved to", outputPath);
				}
			} catch (err) {
				console.error("Error during test:", err);
			}
		},
		60 * 1000
	);
});
