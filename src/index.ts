import tgModel from "./controller/telegram_controller";
import { captureVideoRequests } from "./service/tt_service";
import logger from "./utils/logger";
import { TelegramResponse } from "../@types/TelegramResponse";
import parseMessage from "./utils/parseUserMessage";
import { helpMessage } from "./view/help";
async function main(): Promise<void> {
    console.log("✅ Bot started");
    let offset = 0;
    const processedMessages = new Set<string>();

    async function pullUpdates(): Promise<void> {
        try {
            const update: TelegramResponse = await tgModel.getUpdates(offset);

            if (update.result && Array.isArray(update.result)) {
                for (const content of update.result) {
                    const chatId = content.message?.chat?.id;
                    const messageText = content.message?.text;
                    offset = content.update_id + 1;

                    if (!chatId) continue;

                    logger({
                        message: `Message #${offset} From chat ${chatId}: ${messageText}`,
                    });

                    const parsedMessage = parseMessage(messageText);

                    if (
                        parsedMessage &&
                        parsedMessage.url.includes("tiktok.com")
                    ) {
                        const messageKey = `${parsedMessage.url}_${content.update_id}`;

                        if (processedMessages.has(messageKey)) {
                            logger({
                                message: `Duplicate skipped: ${messageKey}`,
                            });
                            continue;
                        }

                        await captureVideoRequests(
                            parsedMessage.url,
                            chatId.toString(),
                            parsedMessage.startTime,
                            parsedMessage.duration,
                            parsedMessage.cropTop,
                            parsedMessage.cropBottom,
                            parsedMessage.asGif
                        );
                    } else if (messageText.includes("/show")) {
                        await tgModel.sendMessage(chatId, helpMessage);
                    } else {
                        await tgModel.sendMessage(
                            chatId,
                            "❌ No TikTok link found in the message."
                        );
                    }
                }
            }
        } catch (error) {
            console.error("Polling error:", error);
        }
    }

    setInterval(pullUpdates, 1000);
}

main().catch(console.error);
