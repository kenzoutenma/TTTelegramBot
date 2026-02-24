const seconds_to_time = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
};

function parseMessage(text: string): ParsedMessageString | null {
    const urlMatch = text.match(/https?:\/\/\S+/);

    const url = urlMatch ? urlMatch[0] : null;
    const startMatch = text.match(/-start\s+([0-9:.]+)/);
    const durationMatch = text.match(/-duration\s+([0-9:.]+)/);

    const normalizeTime = (time: string) => {
        if (Number(time) && Number(time) > 60) {
            return seconds_to_time(Number(time))
        }

        const parts = time.split(":");

        const padSeconds = (sec: string) => {
            const [int, frac] = sec.split(".");
            return frac
                ? `${int.padStart(2, "0")}.${frac}`
                : int.padStart(2, "0");
        };

        if (parts.length === 3) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${padSeconds(parts[2])}`;
        if (parts.length === 2) return `00:${parts[0].padStart(2, "0")}:${padSeconds(parts[1])}`;
    }

    const byTwoSide = text.match(/-vertical\s+([0-9:.]+)/);
    const cropTop = text.match(/-top\s+([0-9:.]+)/) || byTwoSide;
    const cropBot = text.match(/-bot\s+([0-9:.]+)/) || byTwoSide;
    const gifFlag = /-gif\b/.test(text);
    const noAudioFlag = /-na\b/.test(text);

    return {
        url,
        startTime: startMatch ? normalizeTime(startMatch[1]) : undefined,
        duration: durationMatch ? normalizeTime(durationMatch[1]) : undefined,
        cropTop: cropTop ? cropTop[1] : undefined,
        cropBottom: cropBot ? cropBot[1] : undefined,
        asGif: gifFlag,
        noAudioFlag: noAudioFlag
    };
}

export default parseMessage;
