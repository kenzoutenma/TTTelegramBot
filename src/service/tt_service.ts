import { Browser, BrowserContext, chromium, Page, Request, Response } from "playwright";
import tgModel from "../controller/telegram_controller";
import logger, { textColor, typeOfEmoji } from "../utils/logger";
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
				return this.tg_log ? await this.tg_log.editMessage(chatId, messageId, text) : 0;
			}
		},
		deleteMessage: async (chatId: string, messageId: number | null) => {
			if (this.tg_log && messageId != null) {
				await this.tg_log.deleteMessage(chatId, messageId);
			}
		},
		sendError: async (chatId: string, text: string) => {
			if (this.tg_log) {
				return await this.tg_log.sendMessage(chatId, `${typeOfEmoji["error"]} ${text}`);
			}
		},
	};

	async captureVideoRequests(url: string, chatId: string): Promise<Buffer<ArrayBufferLike> | undefined> {
		const browser: Browser = await chromium.launch({ headless: true });
		const context: BrowserContext = await browser.newContext();
		const page: Page = await context.newPage();

		let resolved = false;
		let videoUrl = "";

		page.on("request", (request) => {
			const reqUrl = request.url();
			if (!resolved && reqUrl.includes("v16-webapp-prime")) {
				console.log("[Request] Found video URL:", reqUrl);
				videoUrl = reqUrl;
				resolved = true;
			}
		});

		console.log("going by url");
		await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30 * 1000 });
		await page.waitForTimeout(2 * 1000);

		if (!videoUrl) {
			console.error("❌ No matching video URL found.");
			await browser.close();
			return;
		}

		const cookies = await context.cookies(videoUrl);
		const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

		console.log("🟢 Fetching video manually...");
		const response = await fetch(videoUrl, {
			headers: {
				Cookie: cookieHeader,
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
				Referer: url,
				Origin: "https://www.tiktok.com",
				Accept: "*/*",
				"Accept-Language": "en-US,en;q=0.9",
			},
		});

		if (!response.ok || !response.body) {
			console.error("❌ Manual fetch failed with status:", response.status);
			await browser.close();
			return;
		}

		const chunks: Uint8Array[] = [];
		const reader = response.body.getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) chunks.push(value);
		}

		await browser.close();
		const buffer = Buffer.concat(chunks);
		console.log("✅ Video downloaded. Size:", buffer.length, "bytes");

		return buffer;
	}
}

export default TikTokService;
