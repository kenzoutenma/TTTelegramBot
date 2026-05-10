import TikTokService from "#/service/tt_service";
import VideoEncodeClass from "#/service/video-encode";
import { ffmpeg_filters } from "#/utils/ffmpeg/generate-filters";
import { ConvertToWebm } from "#/utils/ffmpeg/stickers/convert-photo-to-vSticker";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { IProc } from "./type";

const TT_Service = new TikTokService();
let garbage: TelegramMessageAction[] = [];

async function TikTokProcess({
  content,
  TG_Controller,
}: IProc): Promise<boolean> {
  if (typeof content.params?.url !== "string" || !content.params?.url) {
    console.warn("Invalid or missing URL");
    await TG_Controller.sendMessage(content.chatId, "No valid URL provided");
    return false;
  }

  const progress = await TG_Controller.sendMessage(
    content.chatId,
    "finding video...",
  );
  garbage.push(progress);

  try {
    const video = await TT_Service.captureVideoRequests(content.params.url);
    if (typeof video == "string") return false;

    await TG_Controller.editMessage(
      content.chatId,
      progress.messageID,
      "preparing your video...",
    );

    let filters = ffmpeg_filters({
      extension: content.params.asGif ? "gif" : "mp4",
      cropTop: content.params.cropTop,
      cropBottom: content.params.cropBottom,
      start: content.params.startTime,
      duration: content.params.duration,
      noAudio: content.params.noAudioFlag,
      options: { length: video.length },
    });

    let encodeVideo = await new VideoEncodeClass({
      videoBuffer: video,
      chatId: content.chatId,
    });
    let cropImageMessage, cropLikeMessage;

    async function handleCrop() {
      const previewBuffer = await encodeVideo.getCropPreview(filters);

      cropLikeMessage = await TG_Controller.sendMessage(
        content.chatId,
        "Do you like this crop? Reply 'yes' or 'like' to confirm, or send new crop values.",
      );
      cropImageMessage = await TG_Controller.sendPhoto(
        content.chatId,
        previewBuffer,
        "crop.jpg",
      );

      const confirmation = await TG_Controller.waitForReply(content.chatId);

      garbage.push(cropImageMessage);
      garbage.push(cropLikeMessage);

      if (
        typeof confirmation === "string" &&
        (confirmation.toLowerCase() == "no" ||
          confirmation.toLowerCase() == "dislike")
      ) {
        await TG_Controller.sendMessage(
          content.chatId,
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

    if (
      (content.params.cropTop || content.params.cropBottom) &&
      !cropImageMessage
    ) {
      console.log("ask confirm");
      await handleCrop();
      console.log("confirmed");
    }

    if (content.params?.asGif) {
      const save = await encodeVideo.downloadGif(filters);
      await TG_Controller.sendDocument(
        content.chatId,
        save.video.video,
        save.video_name,
      );
      return true;
    }

    await TG_Controller.editMessage(
      content.chatId,
      progress.messageID,
      "encoding your video...",
    );
    const save = await encodeVideo.downloadVideo(filters);

    if (content.params?.asWebm) {
      const buffer = Buffer.from(save.video.video);
      const tempPath = path.join(os.tmpdir(), `tg_file_as.mp4`);

      await fs.writeFile(tempPath, buffer);

      const webm = await ConvertToWebm(tempPath, true);
      await TG_Controller.sendDocument(content.chatId, webm, "sticker.webm");
      return true;
    }

    await TG_Controller.editMessage(
      content.chatId,
      progress.messageID,
      "sending your video...",
    );

    await TG_Controller.sendVideo(content.chatId, save.video.video, {
      thumbnailBuffer: save.video.thumbnail,
      width: save.video.width,
      height: save.video.height,
    });

    return true;
  } catch (e) {
    console.log(e);
    return false;
  } finally {
    if (Array.isArray(garbage)) {
      await Promise.all(
        garbage.map((msg) =>
          TG_Controller.deleteMessage(msg.chatID, msg.messageID),
        ),
      );
    }
  }
}

export default TikTokProcess;
