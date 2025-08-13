import TelegramController from "#/controller/telegram_controller";
import TikTokService from "#/service/tt_service";

const userID = () => {
	const value: string | null = process.env.TELEGRAM_CHATID || null;
	if (!value) throw new Error("no user's chat id");
	return value;
};

const botToken = () => {
	const value: string | null = process.env.TELEGRAM_BOT_TOKEN || null;
	if (!value) throw new Error("no token");
	return value;
};

const tiktokVideo = () => {
	const value: string | null = process.env.TIKTOK_TEST_URL || null;
	if (!value) throw new Error("no token");
	return value;
};

const TG_Controller = new TelegramController(botToken());
const TT_Service = new TikTokService();

export { userID, botToken, tiktokVideo, TG_Controller, TT_Service };
