import FormData from "form-data";
import { PassThrough } from "stream";
import axios from "axios";
import logger from "../utils/logger";
import { TelegramResponse, TelegramResponseSingle } from "../../@types/TelegramResponse";
import "dotenv/config";
import parseMessage from "#/utils/parseUserMessage";

class TelegramController {
	private baseUrl: string;
	private token: string;
	private offset: number;

	constructor(token: string) {
		this.token = token;
		this.baseUrl = `https://api.telegram.org/bot${token}/`;
		this.offset = 0;
	}

	async start(callback: (content: ParsedTelegramUpdate) => Promise<void>) {
		console.log("✅ Bot is running...");

		while (true) {
			try {
				const update: TelegramResponse = await this.getUpdates(this.offset);
				if (update.result && Array.isArray(update.result)) {
					for (const content of update.result) {
						this.offset = content.update_id + 1;
						const chatId = content.message?.chat?.id;
						if (!chatId) continue;

						const messageText = content.message?.text;
						const parsedMessage = parseMessage(messageText) as ParsedMessageString;

						await callback({
							chatId,
							offset: this.offset,
							message: parsedMessage,
						});
					}
				}
			} catch (err) {
				console.error("Polling error:", err);
			}

			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	async getUpdates(offset: number | null = null): Promise<any> {
		const url = `${this.baseUrl}getUpdates`;
		const params = new URLSearchParams();

		if (offset !== null) params.append("offset", offset.toString());
		params.append("timeout", "100");

		const response = await fetch(`${url}?${params.toString()}`);
		return await response.json();
	}

	async sendMessage(chatId: string | number, text: string): Promise<TelegramMessageAction> {
		const url = `${this.baseUrl}sendMessage`;
		const params = new URLSearchParams({
			chat_id: chatId.toString(),
			text,
			parse_mode: "HTML",
		});

		const response = await fetch(url, {
			method: "POST",
			body: params,
		});

		const data = (await response.json()) as TelegramResponseSingle;
		const messageId = data.result?.message_id.toString();
		logger({
			message: `Sending message ${messageId} to ${chatId}: ${text.split(" ").slice(0, 5).join(" ")}...`,
			emoji: "change",
		});
		return { chatID: chatId.toString(), messageID: messageId };
	}

	async deleteMessage(chatId: string | number, messageId: string): Promise<TelegramMessageAction> {
		const url = `${this.baseUrl}deleteMessage`;
		const payload = new URLSearchParams({
			chat_id: chatId.toString(),
			message_id: messageId.toString(),
		});

		const response = await fetch(url, {
			method: "POST",
			body: payload,
		});

		console.log(await response.json())

		logger({
			message: `Deleted message ${messageId} in ${chatId}`,
			emoji: "change",
		});
		return { chatID: chatId.toString(), messageID: messageId };
	}

	async editMessage(chatId: string | number, messageId: string, text: string): Promise<any> {
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
		});

		return { chatID: chatId.toString(), messageID: messageId };
	}

	async sendVideo(chatId: string | number, videoBuffer: Buffer): Promise<any> {
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
					error: JSON.stringify(error.response.data, null, 2),
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

	async sendDocument(chatId: string | number, fileBuffer: Buffer, filename: string = "video.mp4"): Promise<any> {
		const url = `${this.baseUrl}sendDocument`;
		const form = new FormData();

		const stream = new PassThrough();
		stream.end(fileBuffer);

		form.append("chat_id", chatId.toString());
		form.append("document", stream, {
			filename,
			contentType: "video/mp4",
			knownLength: fileBuffer.length,
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

export default TelegramController;
