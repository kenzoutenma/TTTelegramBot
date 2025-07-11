import ve from "../utils/videoReEncoder";

interface videoPromise {
	type: "gif" | "video";
	chatId: string;
	video: Buffer;
	video_name: string;
}

interface videoEncodeProps {
	videoBuffer: Buffer<ArrayBufferLike>;
	chatId: string;
	start?: string;
	duration?: string;
	cropTop?: string;
	cropBottom?: string;
}

class VideoEncodeClass {
	private videoBuffer;
	private chatId;
	private start;
	private duration;
	private cropTop;
	private cropBottom;

	constructor({ videoBuffer, chatId, start, duration, cropTop, cropBottom }: videoEncodeProps) {
		this.videoBuffer = videoBuffer;
		this.chatId = chatId;
		this.start = start;
		this.duration = duration;
		this.cropTop = cropTop;
		this.cropBottom = cropBottom;
	}

	async downloadGif(): Promise<videoPromise> {
		const end = await ve.reencodeVideo(this.videoBuffer, this.start, this.duration, this.cropTop, this.cropBottom, true);
		return {
			chatId: this.chatId,
			video: end,
			video_name: "video.gif",
			type: "gif" as const,
		};
	}
	async downloadVideo(): Promise<videoPromise> {
		const end = await ve.reencodeVideo(this.videoBuffer, this.start, this.duration, this.cropTop, this.cropBottom, false);
		return {
			chatId: this.chatId,
			video: end,
			video_name: "video.mp4",
			type: "video" as const,
		};
	}
}

export default VideoEncodeClass;
