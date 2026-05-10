interface ParsedMessageString {
  url: string | null;
  startTime?: string;
  duration?: string;
  cropTop?: string;
  cropBottom?: string;
  asGif?: boolean;
  asWebp?: boolean;
  asWebm?: boolean;
  noAudioFlag: boolean;
}

interface ParsedTelegramUpdate {
  chatId: string;
  offset: number;
  message: string | ParsedMessageString;
  image?: string;
}

interface TelegramMessageAction {
  chatID: string;
  messageID: string;
}
