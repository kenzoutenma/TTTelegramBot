import { tg_commands } from "#/configs/commands";

const command_reply = (content: ParsedTelegramUpdate): string | boolean => {
  const commandKey = (Object.keys(tg_commands) as Array<keyof typeof tg_commands>).find((cmd) =>
    content.message.startsWith(cmd)
  );

  return commandKey ? tg_commands[commandKey]() : false
}

export default command_reply