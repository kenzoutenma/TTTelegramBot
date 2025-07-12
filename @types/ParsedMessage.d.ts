interface ParsedMessageString {
    url: string;
    startTime?: string;
    duration?: string;
    cropTop?: string;
    cropBottom?: string;
    asGif?: boolean;
}

interface ParsedTelegramUpdate {
    chatId: number;
    offset: number;
	message: parsedMessage;
}

interface TelegramMessageAction {
	chatID: string;
	messageID: string;
}