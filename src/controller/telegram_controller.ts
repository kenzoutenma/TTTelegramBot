import { tg_commands } from "#/configs/commands";
import parseMessage from "#/utils/parseUserMessage";
import axios from "axios";
import "dotenv/config";
import FormData from "form-data";
import { PassThrough } from "stream";
import { TelegramResponse, TelegramResponseSingle } from "../../@types/TelegramResponse";
import logger from "../utils/logger";

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

						const messageText = content.message?.text?.trim();
						if (!messageText) continue;

						const commandKey = (Object.keys(tg_commands) as Array<keyof typeof tg_commands>)
							.find(cmd => messageText.startsWith(cmd));

						if (commandKey) {
							const message = await tg_commands[commandKey]();
							callback({ chatId, offset: this.offset, message });
						}

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
		params.append("timeout", "10000");

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

		console.log(await response.json());

		logger({
			message: `Deleted message ${messageId} in ${chatId}`,
			emoji: "change",
		});
		return { chatID: chatId.toString(), messageID: messageId };
	}

	async editMessage(chatId: string | number, messageId: string, text: string): Promise<TelegramMessageAction> {
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

	async sendVideo(
		chatId: string | number,
		videoBuffer: Buffer,
		options?: {
			duration?: number;
			width?: number;
			height?: number;
			thumbnailBuffer?: Buffer;
			caption?: string;
			supportsStreaming?: boolean;
		}
	): Promise<any> {
		const url = `${this.baseUrl}sendVideo`;
		const form = new FormData();

		const videoStream = new PassThrough();
		videoStream.end(videoBuffer);

		form.append("chat_id", chatId.toString());
		form.append("video", videoStream, {
			filename: "video.mp4",
			contentType: "video/mp4",
			knownLength: videoBuffer.length,
		});

		if (options?.duration) form.append("duration", options.duration.toString());
		if (options?.width) form.append("width", options.width.toString());
		if (options?.height) form.append("height", options.height.toString());
		if (options?.caption) form.append("caption", options.caption);
		if (options?.supportsStreaming) form.append("supports_streaming", "true");

		if (options?.thumbnailBuffer) {
			const thumbStream = new PassThrough();
			thumbStream.end(options.thumbnailBuffer);
			form.append("thumbnail", thumbStream, {
				filename: "thumb.jpg",
				contentType: "image/jpeg",
				knownLength: options.thumbnailBuffer.length,
			});
		}

		try {
			const response = await axios.post(url, form, {
				headers: form.getHeaders(),
				maxBodyLength: Infinity,
			});
			return response.data;
		} catch (error: any) {
			if (error.response) {
				console.error("Telegram responded with error", JSON.stringify(error.response.data, null, 2));
			} else {
				console.error("Axios error", error.message);
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

	async sendPhoto(chatId: string | number, photoBuffer: Buffer, filename: string = "photo.jpg"): Promise<any> {
		const url = `${this.baseUrl}sendPhoto`;
		const form = new FormData();

		const stream = new PassThrough();
		stream.end(photoBuffer);

		form.append("chat_id", chatId.toString());
		form.append("photo", stream, {
			filename,
			contentType: "image/jpeg",
			knownLength: photoBuffer.length,
		});

		const keyboard = {
			inline_keyboard: [
				[
					{ text: "👍", callback_data: "like" },
					{ text: "👎", callback_data: "dislike" },
				],
			],
		};

		form.append("reply_markup", JSON.stringify(keyboard));

		try {
			const response = await axios.post(url, form, {
				headers: form.getHeaders(),
				maxBodyLength: Infinity,
			});
			const messageId = response.data.result?.message_id.toString();
			return { chatID: chatId.toString(), messageID: messageId };
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

	async waitForReply(chatId: string, timeout: number = 30000): Promise<string | ParsedTelegramUpdate> {
		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			const updates = await this.getUpdates(this.offset);
			const results = updates.result ?? [];
			for (const update of results) {
				this.offset = update.update_id + 1;
				if (update.message && update.message.chat.id.toString() === chatId) {
					const parsedMessage = parseMessage(update.message.text) as ParsedMessageString;
					return {
							chatId: update.message.chat.id,
							offset: this.offset,
							message: parsedMessage,
					};
				}

				if (update.callback_query && update.callback_query.message?.chat?.id.toString() === chatId) {
					return update.callback_query.data || "";
				}
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		throw new Error("Reply timeout exceeded");
	}
}

export default TelegramController;
