import FormData from "form-data";
import { PassThrough } from "stream";
import axios from "axios";
import logger from "../utils/logger";
import { TelegramResponseSingle } from "../../@types/TelegramResponse";
import "dotenv/config";

class TelegramModel {
    private baseUrl: string;
    private token: string;

    constructor(token: string) {
        this.token = token;
        this.baseUrl = `https://api.telegram.org/bot${token}/`;
    }

    async getUpdates(offset: number | null = null): Promise<any> {
        const url = `${this.baseUrl}getUpdates`;
        const params = new URLSearchParams();
        if (offset !== null) params.append("offset", offset.toString());
        params.append("timeout", "100");

        const response = await fetch(`${url}?${params.toString()}`);
        return await response.json();
    }

    async sendMessage(chatId: string | number, text: string): Promise<any> {
        const url = `${this.baseUrl}sendMessage`;
        const params = new URLSearchParams({
            chat_id: chatId.toString(),
            text,
        });

        const response = await fetch(url, {
            method: "POST",
            body: params,
        });

        const data = (await response.json()) as TelegramResponseSingle;
        const messageId = data.result?.message_id;
        logger({
            message: `Sending message ${messageId} to ${chatId}: ${text}`,
            emoji: "change",
        });
        return messageId;
    }

    async deleteMessage(
        chatId: string | number,
        messageId: number
    ): Promise<any> {
        const url = `${this.baseUrl}deleteMessage`;
        const payload = new URLSearchParams({
            chat_id: chatId.toString(),
            message_id: messageId.toString(),
        });

        const response = await fetch(url, {
            method: "POST",
            body: payload,
        });
        logger({
            message: `Deleted message ${messageId} in ${chatId}`,
            emoji: "change",
        });
        return await response.json();
    }

    async editMessage(
        chatId: string | number,
        messageId: number,
        text: string
    ): Promise<any> {
        const url = `${this.baseUrl}editMessageText`;
        const payload = new URLSearchParams({
            chat_id: chatId.toString(),
            message_id: messageId.toString(),
            text,
        });

        const response = await fetch(url, {
            method: "POST",
            body: payload,
        });

        logger({
            message: `Edited message ${messageId} in ${chatId} with new text: ${text}`,
            emoji: "change",
            replace: true,
        });

        return await response.json();
    }

    async sendVideo(
        chatId: string | number,
        videoBuffer: Buffer
    ): Promise<any> {
        const url = `${this.baseUrl}sendVideo`;
        const form = new FormData();

        const stream = new PassThrough();
        stream.end(videoBuffer);

        form.append("chat_id", chatId.toString());
        form.append("video", stream, {
            filename: "video.mp4",
            contentType: "video/mp4",
            knownLength: videoBuffer.length,
        });

        try {
            const response = await axios.post(url, form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
            });

            return response.data;
        } catch (error: any) {
            if (error.response) {
                logger({
                    message: "Telegram responded with error",
                    error: error.response.data,
                    emoji: "error",
                    pickColor: "red",
                });
            } else {
                logger({
                    message: "Axios error",
                    error: error.message,
                    emoji: "error",
                    pickColor: "red",
                });
            }
            throw error;
        }
    }
}

const args = process.argv.slice(2);
let tokenFromFlag: string | undefined = undefined;

args.forEach((arg, index) => {
    if (arg === "-token" && args[index + 1]) {
        tokenFromFlag = args[index + 1];
    }
})

const botToken: string = process.env.TELEGRAM_BOT_TOKEN || tokenFromFlag || "";

if (!botToken) {
    throw new Error("Telegram bot token is required. Please set it in the environment variable TELEGRAM_BOT_TOKEN or pass it as a command line argument with -token");
}

const tgModel = new TelegramModel(botToken);
export default tgModel;
