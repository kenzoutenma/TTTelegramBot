import { ConvertToWebp } from "#/utils/ffmpeg/stickers/convert-photo-to-sticker";
import { ConvertToWebm } from "#/utils/ffmpeg/stickers/convert-photo-to-vSticker";
import { IProc } from "./type";

async function ImageProcess({
  content,
  TG_Controller,
}: IProc): Promise<boolean> {
  try {
    if (content.media) {
      let convert;

      if (content.params?.asWebm) {
        convert = await ConvertToWebm(
          content.media,
          content.message.includes("fit"),
        );
      }
      if (content.params?.asWebp) {
        convert = await ConvertToWebp(content.media);
      }

      if (convert) {
        await TG_Controller.sendDocument(
          content.chatId.toString(),
          convert,
          content.params?.asWebm ? "sticker.webm" : "sticker.webp",
        );
      }

      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}

export default ImageProcess;
