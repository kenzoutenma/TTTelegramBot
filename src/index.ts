import logger from "./utils/logger";
import { helpMessage } from "./view/help";
import TelegramController from "./controller/telegram_controller";
import TikTokService from "./service/tt_service";

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
const TT_Service = new TikTokService(TG_Controller)

async function main(): Promise<void> {
	console.log(`✅ Bot ${botToken} started`);

	const processedMessages = new Set<string>();
	
	await TG_Controller.start(async (content) => {
		if (!content?.message?.url) {
			TG_Controller.sendMessage(content.chatId, helpMessage)
			return
		}

		const messageKey = `${content.message.url}_${content.offset}`;

		if (processedMessages.has(messageKey)) {
			logger({
				message: `Duplicate skipped: ${messageKey}`,
			});
			return;
		}
		processedMessages.add(messageKey);

		const video = await TT_Service.captureVideoRequests(
			content.message.url,
			content.chatId.toString(),
			content.message.startTime,
			content.message.duration,
			content.message.cropTop,
			content.message.cropBottom,
			content.message.asGif
		);
        if(!video) return
        
        switch (video.type) {
            case "gif":
                TG_Controller.sendDocument(video.chatId, video.video, video.video_name)
				break;
            case "video":
                TG_Controller.sendVideo(video.chatId, video.video)
				break;
        }
	})
}

main().catch(console.error);
