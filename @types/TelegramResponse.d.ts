interface TelegramUpdate {
  update_id: number;
  message: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  date: number;
  text: string;
  entities: TelegramEntity[];
  link_preview_options: TelegramLinkPreviewOptions;
  photo?: PhotoFromMessage[];
  animation?: TGAnimation;
  video?: TGAnimation;
  caption?: string;
}

interface PhotoFromMessage {
  file_id: string;
  file_unique_id: string;
  file_size: string;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  language_code: string;
}

interface TelegramChat {
  id: number;
  first_name: string;
  username: string;
  type: "private" | "group" | "supergroup" | "channel";
}

interface TelegramEntity {
  offset: number;
  length: number;
  type: "url";
}

interface TelegramLinkPreviewOptions {
  url: string;
}

export interface TelegramResponse {
  ok: boolean;
  result: TelegramUpdate[];
}

export interface TelegramResponseSingle {
  ok: boolean;
  result: TelegramMessage;
}

// TG Animation object
export interface TGAnimation {
  file_name: string;
  mime_type: string;
  duration: number;
  width: number;
  height: number;
  thumbnail: Thumbnail;
  thumb: Thumb;
  file_id: string;
  file_unique_id: string;
  file_size: number;
}

export interface Thumbnail {
  file_id: string;
  file_unique_id: string;
  file_size: number;
  width: number;
  height: number;
}

export interface Thumb {
  file_id: string;
  file_unique_id: string;
  file_size: number;
  width: number;
  height: number;
}
