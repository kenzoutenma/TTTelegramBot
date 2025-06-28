const typeOfEmoji = {
    ok: "✅",
    error: "❌",
    search: "🔍",
    download: "🧲",
    change: "🔄",
};

const textColor = {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
    reset: "\x1b[0m",
};

interface LoggerOptions {
    message: string;
    emoji?: keyof typeof typeOfEmoji;
    pickColor?: keyof typeof textColor;
    replace?: boolean;
    error?: any;
}

const getCallerTrace = () => {
    const err = new Error();
    const stackLines = err.stack?.split("\n") || [];

    const callerLine = stackLines.find(
        (line) =>
            !line.includes("logger") &&
            (line.includes("at ") || line.includes("file:"))
    );
    if (!callerLine) return "";

    const match =
        callerLine.match(/\((.*):(\d+):\d+\)$/) ||
        callerLine.match(/at (.*):(\d+):\d+$/);
    let fullPath = match?.[1];
    const lineNumber = match?.[2];

    if (!fullPath) return "";

    fullPath = fullPath.replace(/^file:\/\//, "/");

    const projectRoot = process.cwd();
    const relativePath = fullPath.replace(projectRoot, "").replace(/^\/+/, "");

    return `${relativePath}:${lineNumber}`;
};

const logger = ({
    message,
    emoji,
    replace,
    error,
    pickColor = "yellow",
}: LoggerOptions) => {
    let messageR: string = "";

    const now =
        new Date().toISOString().slice(0, 10) +
        " " +
        new Date().toLocaleTimeString("en-US", { hour12: false });

    const color = textColor[pickColor] || textColor.reset;

    if (emoji && typeOfEmoji[emoji]) messageR += `${typeOfEmoji[emoji]}`;

    const tracePath = getCallerTrace();
    messageR += `${color}[${now}] ${tracePath}:${textColor.reset} `;

    if (error) {
        messageR += `\n${textColor["red"]}Error: ${error}\x1b[0m`;
    }

    if (message.split(":").length > 1) {
        messageR += `${textColor.blue}${message.split(":")[0]}:${
            textColor.reset
        }${message.split(":")[1]}`;
    } else {
        messageR += message;
    }

    if (replace) {
        process.stdout.clearLine(-1);
        process.stdout.cursorTo(0);
        process.stdout.write(`${messageR}`);
    } else {
        console.log("\n" + messageR);
    }
};

export default logger;
export { typeOfEmoji, textColor };
