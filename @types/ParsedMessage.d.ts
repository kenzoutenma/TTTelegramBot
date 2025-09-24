interface ParsedMessageString {
    url: string | null;
    startTime?: string;
    duration?: string;
    cropTop?: string;
    cropBottom?: string;
    asGif?: boolean;
    noAudioFlag: boolean
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