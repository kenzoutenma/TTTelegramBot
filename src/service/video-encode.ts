import { takePreview } from "#/utils/ffmpeg/take-a-screen";
import VideoEncoder from "#/utils/ffmpeg/videoReEncoder";

interface videoPromise {
	type: "gif" | "video";
	chatId: string;
	video: Buffer;
	video_name: string;
}

interface videoEncodeProps {
	videoBuffer: Buffer<ArrayBufferLike>;
	chatId: string;
	filterString?: filtered;
}

class VideoEncodeClass {
	private videoBuffer;
	private chatId;
	private filterString;

	constructor({ videoBuffer, chatId, filterString }: videoEncodeProps) {
		this.videoBuffer = videoBuffer;
		this.chatId = chatId;
		this.filterString = filterString;
	}

	async downloadGif(_filters?: filtered): Promise<videoPromise> {
		const baseFilters = _filters ? _filters : this.filterString ? this.filterString : null;
		if (!baseFilters) throw new Error("No filters provided for GIF encoding");
		const filters = { ...baseFilters };

		const end = await VideoEncoder.encodeGIF(this.videoBuffer, filters);
		return {
			chatId: this.chatId,
			video: end,
			video_name: "video.gif",
			type: "gif" as const,
		};
	}

	async getCropPreview(_filters?: filtered): Promise<Buffer> {
		const baseFilters = _filters ? _filters : this.filterString ? this.filterString : null;
		if (!baseFilters) throw new Error("No filters provided for crop preview");
		const filters = { ...baseFilters, extension: "jpg" };

		return await takePreview(this.videoBuffer, filters);
	}

	async downloadVideo(_filters?: filtered): Promise<videoPromise> {
		const baseFilters = _filters ? _filters : this.filterString ? this.filterString : null;
		if (!baseFilters) throw new Error("No filters provided for video encoding");
		const filters = { ...baseFilters };

		const end = await VideoEncoder.encodeVideo(this.videoBuffer, filters);
		return {
			chatId: this.chatId,
			video: end,
			video_name: "video.mp4",
			type: "video" as const,
		};
	}
}

export default VideoEncodeClass;
