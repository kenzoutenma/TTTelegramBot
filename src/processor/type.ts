import TelegramController, {
    TelegramMessageCallbackObj,
} from "#/controller/telegram_controller";

export interface IProc {
  content: TelegramMessageCallbackObj;
  TG_Controller: TelegramController;
}
