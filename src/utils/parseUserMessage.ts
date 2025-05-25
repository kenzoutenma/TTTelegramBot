interface ParsedMessage {
    url: string;
    startTime?: string;
    duration?: string;
    cropTop?: string;
    cropBottom?: string;
    asGif?: boolean;
}

function parseMessage(text: string): ParsedMessage | null {
    const urlMatch = text.match(/https?:\/\/\S+/);
    if (!urlMatch) return null;

    const url = urlMatch[0];
    const startMatch = text.match(/-start\s+([0-9:.]+)/);
    const durationMatch = text.match(/-duration\s+([0-9:.]+)/);

    const normalizeTime = (time: string) => {
        const parts = time.split(":");

        const padSeconds = (sec: string) => {
            const [int, frac] = sec.split(".");
            return frac
                ? `${int.padStart(2, "0")}.${frac}`
                : int.padStart(2, "0");
        };

        if (parts.length === 3)
            return `${parts[0].padStart(2, "0")}:${parts[1].padStart(
                2,
                "0"
            )}:${padSeconds(parts[2])}`;
        if (parts.length === 2)
            return `00:${parts[0].padStart(2, "0")}:${padSeconds(parts[1])}`;
        return `00:00:${padSeconds(parts[0])}`;
    };

    const byTwoSide = text.match(/-vertical\s+([0-9:.]+)/);
    const cropTop = text.match(/-top\s+([0-9:.]+)/) || byTwoSide;
    const cropBot = text.match(/-bot\s+([0-9:.]+)/) || byTwoSide;
    const gifFlag = /-gif\b/.test(text);

    return {
        url,
        startTime: startMatch ? normalizeTime(startMatch[1]) : undefined,
        duration: durationMatch ? normalizeTime(durationMatch[1]) : undefined,
        cropTop: cropTop ? cropTop[1] : undefined,
        cropBottom: cropBot ? cropBot[1] : undefined,
        asGif: gifFlag,
    };
}

export default parseMessage;
