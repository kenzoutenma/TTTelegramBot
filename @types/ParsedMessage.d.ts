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
    chatId: string;
    offset: number;
    message: string | ParsedMessageString;
}

interface TelegramMessageAction {
    chatID: string;
    messageID: string;
}