import { takePreview } from "#/utils/ffmpeg/take-a-screen";
import VideoEncoder from "../utils/videoReEncoder";

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
	noAudio?: boolean;
}

class VideoEncodeClass {
	private videoBuffer;
	private chatId;
	private start;
	private duration;
	private cropTop;
	private cropBottom;
	private noAudio

	constructor({ videoBuffer, chatId, start, duration, cropTop, cropBottom, noAudio }: videoEncodeProps) {
		this.videoBuffer = videoBuffer;
		this.chatId = chatId;
		this.start = start;
		this.duration = duration;
		this.cropTop = cropTop;
		this.cropBottom = cropBottom;
		this.noAudio = noAudio
	}

	async downloadGif(): Promise<videoPromise> {
		const filter = VideoEncoder.filters("gif", this.cropTop, this.cropBottom, this.start, this.duration)
		const end = await VideoEncoder.encodeGIF(this.videoBuffer, filter);
		return {
			chatId: this.chatId,
			video: end,
			video_name: "video.gif",
			type: "gif" as const,
		};
	}

	async getCropPreview(): Promise<Buffer> {
        const filter = VideoEncoder.filters("jpg", this.cropTop, this.cropBottom, this.start, undefined);
        return await takePreview(this.videoBuffer, filter);
    }

	async downloadVideo(): Promise<videoPromise> {
		const filter = VideoEncoder.filters("mp4", this.cropTop, this.cropBottom, this.start, this.duration, this.noAudio)
		console.log(filter)
		const end = await VideoEncoder.encodeVideo(this.videoBuffer, filter);
		return {
			chatId: this.chatId,
			video: end,
			video_name: "video.mp4",
			type: "video" as const,
		};
	}
}

export default VideoEncodeClass;
