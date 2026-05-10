import { helpMessage } from "#/view/help";

export const tg_commands = {
  "/help": (): string => {
    return helpMessage;
  },
};

export const commandKey = (messageText: string) =>
  (Object.keys(tg_commands) as Array<keyof typeof tg_commands>).find((cmd) =>
    messageText.startsWith(cmd),
  );
