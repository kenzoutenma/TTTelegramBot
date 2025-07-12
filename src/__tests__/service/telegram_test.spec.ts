import { TG_Controller, userID } from "#/configs/test-config";

const messages: TelegramMessageAction[] = [];

describe("testing telegram service", () => {
	it("should send message to user", async () => {
		const message = await TG_Controller.sendMessage(userID(), "Hello World!");
		expect(message).toHaveProperty("chatID");
		expect(message).toHaveProperty("messageID");

		messages.push({ chatID: message.chatID, messageID: message.messageID });
	});
	it("should send message to user and change it in 2 seconds", async () => {
		const message = await TG_Controller.sendMessage(userID(), "Loading");
		expect(message).toHaveProperty("chatID");
		expect(message).toHaveProperty("messageID");

		await new Promise((resolve) => setTimeout(resolve, 1000));

		const changed = await TG_Controller.editMessage(userID(), message.messageID, "Finished");
		expect(changed).toHaveProperty("chatID");
		expect(changed).toHaveProperty("messageID");

		messages.push({ chatID: changed.chatID, messageID: changed.messageID });
	});
	afterEach(async () => {
		while (messages.length > 0) {
			const { chatID, messageID } = messages.pop()!;
			await TG_Controller.deleteMessage(chatID, messageID);
		}
	});
});
