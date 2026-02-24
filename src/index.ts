import TelegramController from "./controller/telegram_controller";
import TikTokProcess from "./processor/tiktok";
import logger from "./utils/logger";

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

async function main(): Promise<void> {
	console.log(`✅ Bot ${botToken} started`);

	const processedMessages = new Set<string>();

	await TG_Controller.start(async (content: ParsedTelegramUpdate) => {
		const { chatId, message } = content;

		if (typeof content.message === "string") {
			await TG_Controller.sendMessage(content.chatId.toString(), content.message);
			return;
		}

		if (typeof message == "object" && message.url && message.url.includes("tiktok")) {
			const messageKey = `${message.url}_${content.offset}`;
			if (processedMessages.has(messageKey)) return;

			const data = await TikTokProcess({
				content: content,
				TG_Controller: TG_Controller
			})

			if (Array.isArray(data.garbage)) {
				await Promise.all(
					data.garbage.map(msg => TG_Controller.deleteMessage(msg.chatID, msg.messageID))
				);
			} else if (data && data.error) {
				logger({ message: data.error.toString() });
				return;
			}
		}
	});
}

main().catch(console.error);
