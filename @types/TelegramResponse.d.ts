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
