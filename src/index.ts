import TelegramController, {
  TelegramMessageCallbackObj,
} from "./controller/telegram_controller";
import ImageProcess from "./processor/image";
import TikTokProcess from "./processor/tiktok";

const args = process.argv.slice(2);
let tokenFromFlag: string | undefined = undefined;

args.forEach((arg, index) => {
  if (arg === "-token" && args[index + 1]) {
    tokenFromFlag = args[index + 1];
  }
});

const botToken: string = process.env.TELEGRAM_BOT_TOKEN || tokenFromFlag || "";

if (!botToken) {
  throw new Error(
    "Telegram bot token is required. Please set it in the environment variable TELEGRAM_BOT_TOKEN or pass it as a command line argument with -token",
  );
}

const TG_Controller = new TelegramController(botToken);

async function main(): Promise<void> {
  console.log(`✅ Bot ${botToken} started`);

  await TG_Controller.start(async (content: TelegramMessageCallbackObj) => {
    await ImageProcess({ content, TG_Controller });

    if (content.params?.url?.includes("tiktok"))
      await TikTokProcess({ content, TG_Controller });
  });
}

main().catch(console.error);
