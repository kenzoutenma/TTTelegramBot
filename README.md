
# TTTelegramBot

Node.js bot for search and download video from TikTok


## Installation

Install repository

```bash
git clone https://github.com/AnswerShy/TTTelegramBot.git
```

## Start

To start bot you need to get Telegram API Token in [@BotFather](https://t.me/BotFather)

### Option 1

Insert token in launch option when start bot:
```bash
npx nodemon -token your:token
```
### Option 2

Create *.env* file in root of repository with parameter
```bash
TELEGRAM_BOT_TOKEN="your:telegram-token"
```

## Way to send video


send to bot link:
```bash
http://www.tiktok.com/*video*
```
### Flags
There's all flags to send with url:

+ -start *00:00:00*
> Timing from video will start 

+ -duration *00:00:00* 
> Duration of video 

+ -top *0* 
> Value in pixels to crop from top 

+ -bot *0* 
> Value in pixels to crop from bottom 

+ -gif 
> To send video as a gif 
