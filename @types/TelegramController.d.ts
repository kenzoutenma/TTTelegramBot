interface MessageHandler {
    sendMessage(chatId: string, text: string): Promise<number>; // returns messageId
    editMessage(chatId: string, messageId: number, text: string): Promise<void>;
    deleteMessage(chatId: string, messageId: number): Promise<void>;
    sendVideo(chatId: string, videoBuffer: Buffer): Promise<void>;
    sendDocument(chatId: string, docBuffer: Buffer, filename: string): Promise<void>;
}