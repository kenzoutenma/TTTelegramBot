import TelegramController from "./controller/telegram_controller";
import TikTokService from "./service/tt_service";
import VideoEncodeClass from "./service/video-encode";
import { ffmpeg_filters } from "./utils/ffmpeg/generate-filters";
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

const deleteThese = <{ chatId: string; messageID: string }[]>[];

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

		const progress = await TG_Controller.sendMessage(chatId.toString(), "finding video...");
		deleteThese.push({ chatId: chatId.toString(), messageID: progress.messageID });
		processedMessages.add(messageKey);

		const video = await TT_Service.captureVideoRequests(content.message.url);
		if (typeof video == "string") {
			await TG_Controller.editMessage(chatId.toString(), progress.messageID, video);
			return;
		}

		const { cropTop, cropBottom, startTime, duration, noAudioFlag } = message;

		await TG_Controller.editMessage(chatId.toString(), progress.messageID, "encoding your video...");

		let filters = ffmpeg_filters({
			extension: content.message.asGif ? "gif" : "mp4",
			cropTop: cropTop,
			cropBottom: cropBottom,
			start: startTime,
			duration: duration,
			noAudio: noAudioFlag,
			options: { length: video.length },
		});
		let encodeVideo = await new VideoEncodeClass({ videoBuffer: video, chatId: chatId.toString() });
		let cropImageMessage, cropLikeMessage;

		async function handleCrop() {
			console.log(filters);
			const previewBuffer = await encodeVideo.getCropPreview(filters);
			cropLikeMessage = await TG_Controller.sendMessage(
				chatId.toString(),
				"Do you like this crop? Reply 'yes' or 'like' to confirm, or send new crop values."
			);
			deleteThese.push({ chatId: chatId.toString(), messageID: cropLikeMessage.messageID });
			cropImageMessage = await TG_Controller.sendPhoto(chatId.toString(), previewBuffer, "crop.jpg");
			deleteThese.push({ chatId: chatId.toString(), messageID: cropImageMessage.messageID });
			const confirmation = await TG_Controller.waitForReply(chatId.toString());

			if (typeof confirmation === "string" && (confirmation.toLowerCase() == "no" || confirmation.toLowerCase() == "dislike")) {
				await TG_Controller.sendMessage(chatId.toString(), "Crop cancelled. Send new crop values.");
				return;
			} else if (typeof confirmation === "object") {
				const { chatId, message } = confirmation;
				const { cropTop, cropBottom, startTime, duration, noAudioFlag } = message;
				filters = ffmpeg_filters({
					extension: content.message.asGif ? "gif" : "mp4",
					cropTop: cropTop,
					cropBottom: cropBottom,
					start: startTime,
					duration: duration,
					noAudio: noAudioFlag,
				});
				return await handleCrop();
			}
		}

		if (cropTop || cropBottom) {
			await handleCrop();
		}

		if (content.message.asGif) {
			const save = await encodeVideo.downloadGif(filters);
			await TG_Controller.sendDocument(chatId.toString(), save.video, save.video_name);
		} else {
			const save = await encodeVideo.downloadVideo(filters);
			await TG_Controller.sendVideo(chatId.toString(), save.video);
		}

		deleteThese.map(async (msg) => {
			if (msg.chatId === chatId.toString()) {
				await TG_Controller.deleteMessage(msg.chatId, msg.messageID);
			}
		});
		deleteThese.length = 0;
	});
}

main().catch(console.error);
