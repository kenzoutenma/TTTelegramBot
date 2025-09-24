interface videoData {
	length: number;
	width?: number | undefined;
	height?: number | undefined;
}

interface filterIn {
	extension: "gif" | "mp4" | "jpg",
	cropTop?: string | undefined;
	cropBottom?: string | undefined;
	start?: string | undefined;
	duration?: string | undefined;
	noAudio?: boolean | undefined;
	options?: videoData | null;
}

interface filtered {
	input: string;
	output: string;
	stringified: string[];
	start: string;
	duration: string | undefined;
	noAudio?: boolean | undefined;
	options?: videoData | null;
}