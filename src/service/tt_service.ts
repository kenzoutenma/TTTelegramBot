import { Browser, BrowserContext, chromium, Page, Request } from "playwright";
import tgModel from "../controller/telegram_controller";
import logger, { typeOfEmoji } from "../utils/logger";
import drawProgressBar from "../utils/progressBar";
import ve from "../utils/videoReEncoder";
import TelegramController from "../controller/telegram_controller";

class TikTokService {
	private tg_log;

	constructor(tg_controller: TelegramController) {
		this.tg_log = tg_controller;
	}

	private messageHandler = {
		sendMessage: async (chatId: string, text: string) => {
			return this.tg_log ? await this.tg_log.sendMessage(chatId, text) : 0;
		},
		editMessage: async (chatId: string, messageId: number, text: string) => {
			if (this.tg_log && messageId != null) {
				return this.tg_log ? await this.tg_log.editMessage(chatId, messageId, text) : 0
			}
		},
		deleteMessage: async (chatId: string, messageId: number | null) => {
			if (this.tg_log && messageId != null) {
				await this.tg_log.deleteMessage(chatId, messageId);
			}
		},
		sendError: async (chatId: string, text: string) => {
			if (this.tg_log) {
				return await this.tg_log.sendMessage(
					chatId,
					`${typeOfEmoji["error"]} ${text}`
				);
			}
		},
	};

	async captureVideoRequests(
		url: string,
		chatId: string,
		start?: string,
		duration?: string,
		cropTop?: string,
		cropBottom?: string,
		asGif?: boolean
	): Promise<{ chatId: string; video: Buffer<ArrayBufferLike>; video_name?: string; type: "video" | "gif" } | undefined> {
		const browser: Browser = await chromium.launch({ headless: true });
		const context: BrowserContext = await browser.newContext();
		const page: Page = await context.newPage();

		const startMessage = await this.messageHandler.sendMessage(
			chatId,
			"Please wait while we process your request..."
		);

		let targetUrl: string | null = null;

		page.on("request", (request: Request) => {
			const requestUrl = request.url();
			if (requestUrl.startsWith("https://v16-webapp-prime")) {
				targetUrl = requestUrl;
			}
		});

		await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
		await page.waitForTimeout(5000);

		if (!targetUrl) {
			const msg = this.messageHandler.sendMessage(
				chatId,
				`${typeOfEmoji["error"]} No matching video request found`
			);
			await browser.close();
			return;
		}

		const cookies = await context.cookies(targetUrl);

		try {
			return await this.processVideoDownload(
				targetUrl,
				chatId,
				startMessage,
				cookies,
				start,
				duration,
				cropTop,
				cropBottom,
				asGif
			);
		} catch (err) {
			logger({
				message: "Error during video download:",
				error: err,
				pickColor: "red",
				emoji: "error",
			});
			await this.messageHandler.sendMessage(
				chatId,
				`${typeOfEmoji["error"]} Error during video download.`
			);
		}
		await this.messageHandler.deleteMessage(chatId, startMessage);
		await browser.close();
	}

	private async processVideoDownload(
		videoUrl: string,
		chatId: string,
		messageID: number,
		cookies: any[],
		start?: string,
		duration?: string,
		cropTop?: string,
		cropBottom?: string,
		asGif?: boolean
	) {
		const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

		const response = await fetch(videoUrl, {
			headers: {
				Cookie: cookieHeader,
				"User-Agent": "Mozilla/5.0",
			},
		});

		if (!response.ok || !response.body) {
			this.messageHandler.sendMessage(
				chatId,
				`${typeOfEmoji["error"]} Failed to fetch video (as video from URL).`
			);
			logger({
				message: `Failed to fetch video (as video from URL). Status: ${response.status}`,
				pickColor: "red",
				emoji: "error",
			});
			return;
		}

		const contentLength = response.headers.get("content-length");
		const totalSize = contentLength ? parseInt(contentLength, 10) : null;

		const chunks: Uint8Array[] = [];
		let downloaded = 0;

		const reader = response.body.getReader();

		const progressBarMessage = await this.messageHandler.editMessage(
			chatId,
			messageID,
			`Loading video...`
		);

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) {
				chunks.push(value);
				downloaded += value.length;

				if (totalSize) {
					const percent = (downloaded / totalSize) * 100;
					const progress = drawProgressBar(Number(percent));
					const percentRounded = Math.round(percent);

					if (percentRounded % 25 === 0) {
						await this.messageHandler.editMessage(chatId, progressBarMessage, progress);
					}
				} else {
					logger({ message: `Downloaded`, emoji: "download" });
				}
			}
		}
		await this.messageHandler.editMessage(
			chatId,
			progressBarMessage,
			"finished downloading video. Please wait..."
		);

		const videoBuffer = Buffer.concat(chunks);

		try {
			if (asGif) {
				logger({
					message: `-gif ${asGif} -top ${cropTop} -bot ${cropBottom} -start ${start} -duration ${duration}`,
				});
				await this.messageHandler.editMessage(
					chatId,
					progressBarMessage,
					"Encoding your gif..."
				);
				const end = await ve.reencodeVideo(
					videoBuffer,
					start,
					duration,
					cropTop,
					cropBottom,
					asGif
				);
				await this.messageHandler.editMessage(
					chatId,
					progressBarMessage,
					"Sending your gif..."
				);
				return {chatId: chatId, video: end, video_name: "video.gif", type: "gif" as const}
			} else {
				logger({
					message: `-video ${asGif} -top ${cropTop} -bot ${cropBottom} -start ${start} -duration ${duration}`,
				});
				await this.messageHandler.editMessage(
					chatId,
					progressBarMessage,
					"Encoding your video..."
				);
				const end = await ve.reencodeVideo(
					videoBuffer,
					start,
					duration,
					cropTop,
					cropBottom,
					asGif
				);
				await this.messageHandler.editMessage(
					chatId,
					progressBarMessage,
					"Sending your video..."
				);
				return {chatId: chatId, video: end, type: "video" as const}
			}
		} catch (e) {
			logger({ message: "Finished downloading video.", emoji: "ok" });
			console.error(e);
		}
		// await tgModel.sendVideo(chatId, videoBuffer);
		await this.messageHandler.deleteMessage(chatId, progressBarMessage);
	}
}

export default TikTokService
