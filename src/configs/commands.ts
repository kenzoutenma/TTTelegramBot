import { helpMessage } from "#/view/help";

export const tg_commands = {
	"/help": (): string => {
		return helpMessage;
	},
};
