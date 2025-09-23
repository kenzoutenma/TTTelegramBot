import TelegramController from "./controller/telegram_controller";
import TikTokService from "./service/tt_service";
import VideoEncodeClass from "./service/video-encode";
import logger from "./utils/logger";
import { helpMessage } from "./view/help";

const args = process.argv.slice(2);
let tokenFromFlag: string | undefined = undefined;

args.forEach((arg, index) => {
	if (arg === "-token" && args[index + 1]) {
		tokenFromFlag = args[index + 1];
	}
});

const botToken: string = process.env.TELEGRAM_BOT_TOKEN || tokenFromFlag || "";

if (!botToken) {
	throw new Error(
		"Telegram bot token is required. Please set it in the environment variable TELEGRAM_BOT_TOKEN or pass it as a command line argument with -token"
	);
}

const TG_Controller = new TelegramController(botToken);
const TT_Service = new TikTokService();

async function main(): Promise<void> {
	console.log(`✅ Bot ${botToken} started`);

	const processedMessages = new Set<string>();

	await TG_Controller.start(async (content: ParsedTelegramUpdate) => {
		if (!content?.message?.url) {
			TG_Controller.sendMessage(content.chatId, helpMessage);
			return;
		}

		const messageKey = `${content.message.url}_${content.offset}`;
		const { chatId, message } = content;
		
		if (processedMessages.has(messageKey)) {
			logger({
				message: `Duplicate skipped: ${messageKey}`,
			});
			return;
		}

		const progress = await TG_Controller.sendMessage(chatId.toString(), 'finding video...')
		processedMessages.add(messageKey);

		const video = await TT_Service.captureVideoRequests(
			content.message.url,
		);
		if (!video) return;

		const { cropTop, cropBottom, startTime, duration, noAudioFlag } = message;

		await TG_Controller.editMessage(chatId.toString(), progress.messageID, 'encoding your video...')

		const encodeVideo = await new VideoEncodeClass({videoBuffer: video, chatId: chatId.toString(), cropTop, cropBottom, start: startTime, duration, noAudio: noAudioFlag})
		let cropImageMessage, cropLikeMessage;
		if (cropTop || cropBottom) {
				const previewBuffer = await encodeVideo.getCropPreview();
				cropLikeMessage = await TG_Controller.sendMessage(chatId.toString(), "Do you like this crop? Reply 'yes' or 'like' to confirm, or send new crop values.");
				cropImageMessage = await TG_Controller.sendPhoto(chatId.toString(), previewBuffer, "crop.jpg");
				const confirmation = await TG_Controller.waitForReply(chatId.toString());
				console.log(confirmation)
				if (confirmation.toLowerCase() == "no" || confirmation.toLowerCase() == "dislike") {
						await TG_Controller.sendMessage(chatId.toString(), "Crop cancelled. Send new crop values.");
						return;
				}
		}

		if (content.message.asGif) {
			const save = await encodeVideo.downloadGif()
			await TG_Controller.sendDocument(chatId.toString(), save.video, save.video_name);
		}
		else {
			const save = await encodeVideo.downloadVideo()
			await TG_Controller.sendVideo(chatId.toString(), save.video);
		}
		TG_Controller.deleteMessage(chatId, progress.messageID)
		TG_Controller.deleteMessage(chatId, cropLikeMessage?.messageID || "")
		TG_Controller.deleteMessage(chatId, cropImageMessage?.messageID || "")
	});
}

main().catch(console.error);
