import TelegramController from "#/controller/telegram_controller";
import TikTokService from "#/service/tt_service";
import VideoEncodeClass from "#/service/video-encode";
import { writeFile } from "fs/promises";
import { join } from "path";

const botToken: string | null = process.env.TELEGRAM_BOT_TOKEN || null;
if (!botToken) throw new Error("no token");

const TG_Controller = new TelegramController(botToken);
const TT_Service = new TikTokService(TG_Controller);
let buffer: Buffer<ArrayBufferLike> | undefined;
const chatID = "1221999428";

describe("first", () => {
	it(
		"should return video in buffer",
		async () => {
			buffer = await TT_Service.captureVideoRequests("https://www.tiktok.com/@slay_award/video/7522510761151778080", chatID);
		},
		60 * 1000
	);
	it(
		"should save video in folder",
		async () => {
			if (!buffer) return;
			const encodeVideo = await new VideoEncodeClass({ videoBuffer: buffer, chatId: chatID }).downloadVideo();
			if (encodeVideo && Buffer.isBuffer(encodeVideo)) {
				const outputPath = join(process.cwd(), "test_output.mp4");
				await writeFile(outputPath, encodeVideo);
				console.log("Video saved to", outputPath);
			}
		},
		60 * 1000
	);
});
