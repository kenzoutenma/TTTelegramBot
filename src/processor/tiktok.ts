import TelegramController from "#/controller/telegram_controller";
import TikTokService from "#/service/tt_service";
import VideoEncodeClass from "#/service/video-encode";
import { ffmpeg_filters } from "#/utils/ffmpeg/generate-filters";
import { ConvertToWebm } from "#/utils/ffmpeg/stickers/convert-photo-to-vSticker";
import fs from "fs/promises";
import os from "os";
import path from "path";

const TT_Service = new TikTokService();

interface ITikTokProcessor {
  content: ParsedTelegramUpdate;
  TG_Controller: TelegramController;
}

async function TikTokProcess(
  data: ITikTokProcessor,
): Promise<{ error: string | boolean; garbage?: TelegramMessageAction[] }> {
  let garbage: TelegramMessageAction[] = [];
  const { chatId, message } = data.content;
  if (typeof message == "string" || !message.url)
    return { error: "message is String pr there no URL" };

  const progress = await data.TG_Controller.sendMessage(
    chatId.toString(),
    "finding video...",
  );
  garbage.push(progress);

  try {
    const video = await TT_Service.captureVideoRequests(message.url);
    if (typeof video == "string") return { error: video, garbage: garbage };

    await data.TG_Controller.editMessage(
      chatId.toString(),
      progress.messageID,
      "preparing your video...",
    );

    let filters = ffmpeg_filters({
      extension: message.asGif ? "gif" : "mp4",
      cropTop: message.cropTop,
      cropBottom: message.cropBottom,
      start: message.startTime,
      duration: message.duration,
      noAudio: message.noAudioFlag,
      options: { length: video.length },
    });

    let encodeVideo = await new VideoEncodeClass({
      videoBuffer: video,
      chatId: chatId.toString(),
    });
    let cropImageMessage, cropLikeMessage;

    async function handleCrop() {
      const previewBuffer = await encodeVideo.getCropPreview(filters);

      cropLikeMessage = await data.TG_Controller.sendMessage(
        chatId.toString(),
        "Do you like this crop? Reply 'yes' or 'like' to confirm, or send new crop values.",
      );
      cropImageMessage = await data.TG_Controller.sendPhoto(
        chatId.toString(),
        previewBuffer,
        "crop.jpg",
      );

      const confirmation = await data.TG_Controller.waitForReply(
        chatId.toString(),
      );

      garbage.push(cropImageMessage);
      garbage.push(cropLikeMessage);

      if (
        typeof confirmation === "string" &&
        (confirmation.toLowerCase() == "no" ||
          confirmation.toLowerCase() == "dislike")
      ) {
        await data.TG_Controller.sendMessage(
          chatId.toString(),
          "Crop cancelled. Send new crop values.",
        );
        return;
      } else if (
        typeof confirmation === "object" &&
        typeof confirmation.message === "object"
      ) {
        filters = ffmpeg_filters({
          extension: confirmation.message.asGif ? "gif" : "mp4",
          cropTop: confirmation.message.cropTop,
          cropBottom: confirmation.message.cropBottom,
          start: confirmation.message.startTime,
          duration: confirmation.message.duration,
          noAudio: confirmation.message.noAudioFlag,
          options: { length: video.length },
        });
        return await handleCrop();
      }
    }

    if ((message.cropTop || message.cropBottom) && !cropImageMessage) {
      console.log("ask confirm");
      await handleCrop();
      console.log("confirmed");
    }

    if (message?.asGif) {
      const save = await encodeVideo.downloadGif(filters);
      await data.TG_Controller.sendDocument(
        chatId.toString(),
        save.video.video,
        save.video_name,
      );
      return { error: false, garbage: garbage };
    }

    await data.TG_Controller.editMessage(
      chatId.toString(),
      progress.messageID,
      "encoding your video...",
    );
    const save = await encodeVideo.downloadVideo(filters);

    if (message?.asSticker) {
      console.log("convertings sticker");
      const buffer = Buffer.from(save.video.video);
      const tempPath = path.join(os.tmpdir(), `tg_file_as.mp4`);

      await fs.writeFile(tempPath, buffer);

      const webm = await ConvertToWebm(tempPath, true);
      await data.TG_Controller.sendDocument(
        chatId.toString(),
        webm,
        "sticker.webm",
      );
      return { error: false, garbage: garbage };
    }

    await data.TG_Controller.editMessage(
      chatId.toString(),
      progress.messageID,
      "sending your video...",
    );

    await data.TG_Controller.sendVideo(chatId.toString(), save.video.video, {
      thumbnailBuffer: save.video.thumbnail,
      width: save.video.width,
      height: save.video.height,
    });

    return { error: false, garbage: garbage };
  } catch (e) {
    console.log(e);
    return {
      error: e instanceof Error ? e.message : String(e),
      garbage: garbage,
    };
  }
}

export default TikTokProcess;
