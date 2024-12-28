import { configDotenv } from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { encrypt, decrypt } from "./encryption.js";
import isUrl from "is-url";
import chat from "./genai.js";
import { connectToDatabase } from "./config.js";
import { addToConversationHistory, getConversationHistory } from "./userHistory.js";
import MutedChats from "./model/muted-chats.js"
import gTTS from "gtts"
import { changeAudioSpeed } from "./audo-editor.js";
import { generate } from "randomstring";
import fs from "fs"
import ddg from "ddg"
//import music from "./music.js";
import path from "path";
import { createReadStream } from "fs";


configDotenv()
connectToDatabase()


const token = process.env.KEY;
const botID = 7814437622
const masterID = 7671963344

const bot = new TelegramBot(token, {polling: true});

function escapeCode(code) {
  return code
    .replace(/&/g, '&amp;')  // Escape &
    .replace(/</g, '&lt;')   // Escape <
    .replace(/>/g, '&gt;')   // Escape >
    .replace(/"/g, '&quot;') // Escape "
    .replace(/'/g, '&#39;'); // Escape '
}
function sanitizeHtmlForTelegram(input) {
  // Replace paragraphs with new lines
  let sanitized = input
  // Convert H1 headers (# Header) to <b>Header</b><br/>
  .replace(/^# (.*?)$/gm, '<b>$1</b><br/>')
  // Convert H2 headers (## Header) to <b><i>Header</i></b><br/>
  .replace(/^## (.*?)$/gm, '<b><i>$1</i></b><br/>')
  // Convert H3 headers (### Header) to <i>Header</i><br/>
  .replace(/^### (.*?)$/gm, '<i>$1</i><br/>')
  // Convert bold (**text**) to <b>text</b>
  .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
  // Convert italic (*text* or _text_) to <i>text</i>
  .replace(/_(.*?)_/g, '<i>$1</i>')
  // Underline -> <u>text</u> (using __text__ in MarkdownV2)
  .replace(/__(.*?)__/g, '<u>$1</u>')
  // Strikethrough -> <s>text</s> (using ~text~ in MarkdownV2)
  .replace(/~(.*?)~/g, '<s>$1</s>')
  // Convert unordered lists (* or -) to bullet points
  .replace(/(?:\n|^)[*-]/g, `
• `)
  // Convert ordered lists (1. 2. etc.) to numbers
  .replace(/(?:\n|^)(\d+)\./g, `
$1. `)
  // Convert preformatted blocks (```text```) to <pre>text</pre>
  .replace(/```(.*?)```/gs, (_, code) => `<pre>${escapeCode(code)}</pre>`)
  .replace(/`(.*?)`/gs, (_, code) => `<pre>${escapeCode(code)}</pre>`)
  // Convert links [text](url) to <a href="url">text</a>
  .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
  // Convert newlines (two spaces or more) to <br/>
  //.replace(/\n\n+/g, '<br/><br/>')
  // Escape non-HTML < and >
  //.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return sanitized;
}

function sanitizeForVoice(input) {
  //input = await formatEmojis(input)
  // Replace paragraphs with new lines
  let sanitized = input
  // Convert H1 headers (# Header) to <b>Header</b><br/>
  .replace(/^# (.*?)$/gm, '')
  // Convert H2 headers (## Header) to <b><i>Header</i></b><br/>
  .replace(/^## (.*?)$/gm, '')
  // Convert H3 headers (### Header) to <i>Header</i><br/>
  .replace(/^### (.*?)$/gm, '')
  // Convert bold (**text**) to <b>text</b>
  .replace(/\*\*(.*?)\*\*/g, '')
  // Convert italic (*text* or _text_) to <i>text</i>
  .replace(/_(.*?)_/g, '')
  // Underline -> <u>text</u> (using __text__ in MarkdownV2)
  .replace(/__(.*?)__/g, '')
  // Strikethrough -> <s>text</s> (using ~text~ in MarkdownV2)
  .replace(/~(.*?)~/g, '')
  // Convert unordered lists (* or -) to bullet points
  .replace(/(?:\n|^)[*-]/g, ``)
  // Convert ordered lists (1. 2. etc.) to numbers
  .replace(/(?:\n|^)(\d+)\./g, ``)
  // Convert inline code (`code`) to <code>code</code>
  .replace(/`(.*?)`/g, '')
  // Convert preformatted blocks (```text```) to <pre>text</pre>
  .replace(/```(.*?)```/gs, '')
  // Convert links [text](url) to <a href="url">text</a>
  .replace(/\[(.*?)\]\((.*?)\)/g, '')
  // Convert newlines (two spaces or more) to <br/>
  //.replace(/\n\n+/g, '<br/><br/>')
  // Escape non-HTML < and >
  //.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return sanitized;
}

const sendMessage = (chatId, text, options = {}) => {
  bot.sendChatAction(chatId, 'typing').then(() => {
    setTimeout(() => {
      bot.sendMessage(chatId, text, options)
      .then()
      .catch((error) => {
        console.error('Failed to send message:', error);
      });
    }, 2000); // 2-second delay
  });
};

bot.onText(/\/start/, (msg, match) => {
  const chatId = msg.chat.id;

  const options = {
    reply_markup: {
      keyboard: [
        [{ text: '🎲 Random', callback_data: 'random' }],
        //[{ text: '😎 share contact with robot', request_contact: true }],
        //[{ text: '🙌 share location with robot', request_location: true }]
      ]
    }
  };
  sendMessage(chatId, 
`
Hi
`
);
  bot.deleteMessage(chatId, msg.message_id)
});

/*
bot.onText(/\/music (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = msg.text.substring(7).trim()

  await music(input, (result, thumbnail) => {
    if(result === false || result === "No songs found")
      return sendMessage(chatId, 
`
<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>
🎶
${result === false ? "Something went wrong" : result}
`, {parse_mode : "HTML"})
    const audio = path.resolve(result)
    bot.sendAudio(chatId, audio, {
      caption : `<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>`,
      thumbnail : thumbnail,
      parse_mode : "HTML"
    })
    .finally(() => {
      fs.unlink(audio, (err) => {
        if (err) {
          return;
        }
      });
    })
    
  })
})
*/
bot.onText(/\$voice/, async (msg, match) => {
  const chatId = msg.chat.id;
  
  let input = `${msg.text} ${msg.from.id === masterID ? "user" + msg.from.id : ""}`
  const userID = msg.from.id
  
  const history = await getConversationHistory(userID)
  if(msg.reply_to_message && msg.reply_to_message?.text && msg.reply_to_message.from.id === botID)
    history.push({
      role: "model",
      parts: [
        {text: msg.reply_to_message.text},
      ],
    }
  )

  const response = sanitizeForVoice(await chat(input, history))

  const speech = new gTTS(response, "en-uk", false)
  const inVoice = generate(9)
  const outVoice = generate(9)

  speech.save(`./${inVoice}.mp3`, async (err, result) => {

    changeAudioSpeed(`./${inVoice}.mp3`, `./${outVoice}.mp3`, async () => {
      try {
        bot.sendVoice(chatId, `./${outVoice}.mp3`, {reply_to_message_id : msg.message_id})
        await addToConversationHistory(userID, input, "user")
        await addToConversationHistory(userID, response, "model")
      }
      catch(err) {
        sendMessage(chatId, 
`<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>
${sanitizeHtmlForTelegram(response)}


Could not send as a voice message
`, {parse_mode : "HTML"})
        await addToConversationHistory(userID, input, "user")
        await addToConversationHistory(userID, response, "model")
      }
      finally {
        fs.unlink(`./${inVoice}.mp3`, (err) => {
          if (err) {
            return;
          }
        });
        fs.unlink(`./${outVoice}.mp3`, (err) => {
          if (err) {
            return;
          }
        });
      }
    })
  })
});

bot.onText(/\/search (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = msg.text.substring(7).trim()

  ddg.query(input, {
		"useragent": "My duckduckgo app",
		"no_redirects": "1",
		"no_html": "0",
}, (err, data) => {
    if(err) 
      return

    let message = `<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a> 🔎\n\n\n`
    
    if(data.RelatedTopics.length === 0)
      message += "Could not find result"

    message += data.AbstractText

    data.RelatedTopics.forEach(element => {
        message += element.FirstURL + "\n" ?? "" + "\n"
        message += element.Text ?? "" + "\n"
        message += "\n\n"
    });

    data.Results.forEach(element => {
        message += element.FirstURL + "\n" ?? "" + "\n"
        message += element.Text ?? "" + "\n"
        message += "\n\n"
    });

    return sendMessage(chatId, message, {parse_mode : "HTML"})
  })
});

bot.onText(/\/ignore/, async (msg, match) => {
  const chatID = msg.chat.id;
  if(msg.from.id !== masterID)
    return sendMessage(chatID, 
`
<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>

You are not the Creator
`, {parse_mode : "HTML"}
);
 else if(!msg?.reply_to_message?.from?.id || msg?.reply_to_message?.from?.id === masterID) {
  return sendMessage(chatID, "You have to reply to the message of the person to be ignored")
 }
 
 else if(msg.reply_to_message.from.id === botID)
  return
 else {
  const isMuted = await MutedChats.findOne({chatID : `${msg.reply_to_message.from.id}`})
  if(!isMuted) {
    await MutedChats.create({
      chatID : `${msg.reply_to_message.from.id}`
    })
  }
  return sendMessage(chatID, 
`
<a href="tg://user?id=${msg.reply_to_message.from.id}">${msg.reply_to_message.from.first_name}</a>

Has been blacklisted
`, {parse_mode : "HTML"}
    )
 }
})

bot.onText(/\/canuse/, async (msg, match) => {
  const chatID = msg.chat.id;
  if(msg.from.id !== masterID)
    return sendMessage(chatID, 
`
<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>

You are not the Creator
`, {parse_mode : "HTML"}
);
 else if(!msg?.reply_to_message?.from?.id) {
  return sendMessage(chatID, "You have to reply to the message of the person to be freed")
 }
 
 else if(msg.reply_to_message.from.id === botID)
  return
 else {
  await MutedChats.deleteOne({chatID : `${msg.reply_to_message.from.id}`})
  return sendMessage(chatID, 
`
<a href="tg://user?id=${msg.reply_to_message.from.id}">${msg.reply_to_message.from.first_name}</a>

Has been whitelisted. Can now use the bot.
`, {parse_mode : "HTML"}
    )
 }
})


bot.onText(/\/url (.+)/, (msg, match) => {
  const chatId = msg.chat.id;

  const link = decrypt(match[1])
  if(link && isUrl(link)) {
    return sendMessage(chatId,
`
Link from <a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>


<a href="${link}" >Link</a>
` , {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'visit link', callback_data: 'link', url : link }],
    ]
  }, parse_mode : "HTML", reply_to_message_id: msg.message_id
})
  }
});


bot.onText(/\/ask (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  const prompt = `${match[1].trim()} ${msg.from.id === masterID ? "user" + msg.from.id : ""}`
  const response = await chat(prompt)
  return sendMessage(chatId, 
`<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>
${sanitizeHtmlForTelegram(response)}
`, {parse_mode : "HTML"})
});

bot.on('message', async (msg) => {
  const isMuted = await MutedChats.findOne({chatID : `${msg.from.id}`})
  if(isMuted)
    return 0
  const chatId = msg.chat.id;
  const ignoringCommands = ["/url","/ask","/search", "$voice", "/ignore", "/canuse", "/music"]
  const triggerWords = [
    "gideon",
    // Greetings
    /*
    "hi", 
    "hello", 
    "hey", 
    "good morning", 
    "good afternoon", 
    "good evening", 
    "what's up", 
    "howdy", 
    "greetings", 
    "sup",
    
    // Cry for Help
    "help", 
    "please help", 
    "i need help", 
    "can someone help", 
    "emergency", 
    "i'm in trouble", 
    "i need assistance", 
    "help me", 
    "sos", 
    "save me", 
  
    // Common Questions/Statements
    "anyone here?", 
    "is anyone there?", 
    "i'm new here", 
    "how are you?", 
    "hru", 
    "what's going on?", 
    "what's happening?", 
    "where is everyone?", 
    "can you help me?", 
    "i need advice",
    
    // Expressions of Emotion
    "i'm sad", 
    "i'm happy", 
    "i feel lonely", 
    "i'm angry", 
    "i'm scared", 
    "i'm excited", 
    "i'm confused", 
    "i'm lost", 
    "i'm frustrated", 
    "i need a friend"
    */
  ];
  if(msg.text === undefined || msg.text === "/start" || msg.text === "/search" || ignoringCommands.some( c => msg.text.startsWith(c)) || msg.contact || msg.location)
    return
  else if(msg.text.toLowerCase() === "/help") {
    return sendMessage(chatId, 
`
Here is a list of all commands
/start - Start / View robots options
/search - Search google with the bot
/help - view all bot's commands
/ask - Use generative AI
$voice - for the ai to use voice messages
/music - /music <music name> to request a song
`
    )
  }
  
  else if(msg.chat.type === "private") {
    let input = `${msg.text} ${msg.from.id === masterID ? "user" + msg.from.id : ""} timestamp{${new Date().toUTCString()}}`
    const userID = msg.from.id
    const history = await getConversationHistory(userID)
    const response = await chat(input, history)

    try {
      sendMessage(chatId, `${sanitizeHtmlForTelegram(response)}`, {reply_to_message_id : msg.message_id, parse_mode : "HTML"})
      await addToConversationHistory(userID, input, "user")
      await addToConversationHistory(userID, response, "model")
      return
    }
    catch(err) {
      sendMessage(chatId, 
`<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>
${sanitizeHtmlForTelegram(response)}
`, {parse_mode : "HTML"})
      await addToConversationHistory(userID, input, "user")
      await addToConversationHistory(userID, response, "model")
      return
    }
  }
  else if(triggerWords.some( word => msg.text.toLowerCase().includes(word)) || (msg.reply_to_message && msg.reply_to_message.from.id === botID)) {
    let input = `${msg.text} ${msg.from.id === masterID ? "user" + msg.from.id : ""} timestamp{${new Date().toUTCString()}}`
    const userID = msg.from.id
    const history = await getConversationHistory(userID)
    if(msg.reply_to_message && msg.reply_to_message?.text && msg.reply_to_message.from.id === botID)
      history.push({
        role: "model",
        parts: [
          {text: msg.reply_to_message.text},
        ],
      }
    )
    const response = await chat(input, history)

    try {
      sendMessage(chatId, `${sanitizeHtmlForTelegram(response)}`, {reply_to_message_id : msg.message_id, parse_mode : "HTML"})
      await addToConversationHistory(userID, input, "user")
      await addToConversationHistory(userID, response, "model")
      return
    }
    catch(err) {
      sendMessage(chatId, 
`<a href="tg://user?id=${msg.from.id}">${msg.from.first_name}</a>
${sanitizeHtmlForTelegram(response)}
`, {parse_mode : "HTML"})
      await addToConversationHistory(userID, input, "user")
      await addToConversationHistory(userID, response, "model")
      return
    }
  }
  else {
    /**/return
  }
});

bot.on("contact", (msg) => {
  const chatId = msg.chat.id;
  sendMessage(chatId, 'Your number has been received');
})

bot.on("location", (msg) => {
  const chatId = msg.chat.id;
  sendMessage(chatId, "Wow, you are from : " + msg.location.latitude)
})

bot.on('inline_query', (query) => {
  if(isUrl(query.query))
    return bot.answerInlineQuery(query.id, [{
      id: 0,
      type : "article",
      title:  "🔗🔏 URL",
      description: "You are sending an encrypted link :",
      message_text: "/url " + encrypt(query.query),
      url : query.query,
  }]);
  return bot.answerInlineQuery(query.id, []);
});

bot.on("polling_error", (err) => {
    console.error(err)
})

console.info("Robot online")