
# TTTelegramBot

Node.js bot for search and download video from TikTok


### Installation

Install repository with

```bash
git clone https://github.com/AnswerShy/TTTelegramBot.git
```

### Start

To start bot you need to get Telegram API Token in [@BotFather](https://t.me/BotFather). 


#### > Option 1 [Docker]

Create *.env* file in root of repository or set it in CLI:
```bash
TELEGRAM_BOT_TOKEN="your:telegram-token"
```
After creating *.env* you can start docker container
```bash
docker compose -f 'compose.yaml' up -d --build 'server'
```

#### > Option 2 [With npm]


First of all install all dependencies
```bash
npm install
```
Build app with
```bash
npm run build
```
And start it
```bash
npm run start
```

Insert telegram token like in first option. If you *dont want* to set .env do this instead: 
```bash
 npm run start -- -token your:token 
```

## Way to send video


Send to bot messsage with link:
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
