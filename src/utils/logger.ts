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
};

interface LoggerOptions {
    message: string;
    emoji?: keyof typeof typeOfEmoji;
    pickColor?: keyof typeof textColor;
    replace?: boolean;
    error?: any;
}

const logger = ({
    message,
    emoji,
    replace,
    error,
    pickColor = "green",
}: LoggerOptions) => {
    let messageR: string = "";

    if (emoji && typeOfEmoji[emoji]) {
        messageR += `${typeOfEmoji[emoji]} `;
    }
    messageR += `${
        textColor[pickColor]
    }[${new Date().toISOString()}]:\x1b[0m ${message}`;

    if (error) {
        messageR += `\n${textColor["red"]}Error: ${error}\x1b[0m`;
    }

    if (replace) {
        process.stdout.clearLine(-1);
        process.stdout.cursorTo(0);
        process.stdout.write(`Progress: ${messageR}`);
    } else {
        console.log("\n" + messageR);
    }
};



export default logger;
export { typeOfEmoji, textColor };
