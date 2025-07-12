import TikTokService from "#/service/tt_service";
import VideoEncodeClass from "#/service/video-encode";
import { writeFile } from "fs/promises";
import { join } from "path";

const TT_Service = new TikTokService();
let buffer: Buffer<ArrayBufferLike> | undefined;
const chatID = "1221999428";

describe("first", () => {
	it(
		"should return video in buffer",
		async () => {
			buffer = await TT_Service.captureVideoRequests("https://www.tiktok.com/@slay_award/video/7522510761151778080");
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

			const encoder = new VideoEncodeClass({ videoBuffer: buffer, chatId: chatID });
			try {
				const encodeVideo = await encoder.downloadVideo();
				console.log("Encoded video:", encodeVideo);
				console.log("Is buffer:", Buffer.isBuffer(encodeVideo.video));

				expect(Buffer.isBuffer(encodeVideo.video)).toBe(true);

				if (encodeVideo && Buffer.isBuffer(encodeVideo.video)) {
					const outputPath = join(process.cwd(), "test_output.mp4");
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
