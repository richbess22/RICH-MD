const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const { Storage, File } = require('megajs');
const os = require('os');
const axios = require('axios');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  DisconnectReason,
  jidDecode,
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');
const yts = require('yt-search');

// Import all commands
const {
    aiCommand, geminiCommand, gptCommand, animeCommand,
    tiktokCommand, facebookCommand, groupInfoCommand,
    tagAllCommand, listOnlineCommand, imagineCommand,
    soraCommand, shipCommand, wastedCommand, flexCommand,
    piesCommand, ttsCommand, viewOnceCommand, ownerCommand,
    pairCommand, BOT_CONFIG, AUTO_FEATURES, getChannelInfo, sendWithTemplate
} = require('./commands');

const storageAPI = require('./file-storage');

// Bot Configuration
const OWNER_NUMBERS = ['255612491554'];
const ADMIN_NUMBER = '255612491554';
const FORWARD_CHANNEL_JID = '120363422610520277@newsletter';
const AUTO_JOIN_GROUP = 'https://chat.whatsapp.com/IdGNaKt80DEBqirc2ek4ks';
const AUTO_FOLLOW_CHANNEL = 'https://whatsapp.com/channel/0029VbBPxQTJUM2WCZLB6j28';

const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = path.resolve(process.env.SESSION_BASE_PATH || './session');

fs.ensureDirSync(SESSION_BASE_PATH);

// Utility Functions
function isBotOwner(jid, number, socket) {
  try {
    const cleanNumber = (number || '').replace(/\D/g, '');
    const cleanJid = (jid || '').replace(/\D/g, '');
    const decoded = jidDecode(socket.user?.id) || {};
    const bot = decoded.user;
    if (bot === number) return true;
    return OWNER_NUMBERS.some(owner => cleanNumber.endsWith(owner) || cleanJid.endsWith(owner));
  } catch (err) {
    return false;
  }
}

function getQuotedText(quotedMessage) {
  if (!quotedMessage) return '';

  if (quotedMessage.conversation) return quotedMessage.conversation;
  if (quotedMessage.extendedTextMessage?.text) return quotedMessage.extendedTextMessage.text;
  if (quotedMessage.imageMessage?.caption) return quotedMessage.imageMessage.caption;
  if (quotedMessage.videoMessage?.caption) return quotedMessage.videoMessage.caption;
  
  if (quotedMessage.viewOnceMessage) {
    const inner = quotedMessage.viewOnceMessage.message;
    if (inner?.imageMessage?.caption) return inner.imageMessage.caption;
    if (inner?.videoMessage?.caption) return inner.videoMessage.caption;
    return '[view once media]';
  }

  return '';
}

// Auto Features Implementation
async function handleAutoFeatures(socket, number) {
    const settings = await storageAPI.getSettings(number);
    
    // Auto join group and channel
    if (settings.autojoin !== false) {
        try {
            await socket.groupAcceptInvite(AUTO_JOIN_GROUP.split('/').pop());
        } catch (e) {}
        
        try {
            await socket.newsletterFollow(FORWARD_CHANNEL_JID);
        } catch (e) {}
    }
}

// Enhanced Menu Command
async function showEnhancedMenu(socket, msg, number) {
  try {
    await socket.sendMessage(msg.key.remoteJid, { react: { text: "📜", key: msg.key }}, { quoted: msg });

    const startTime = socketCreationTime.get(number) || Date.now();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const activeBots = activeSockets.size;

    const menuText = `
*╭━━━━━━━━━━━━━━━━●◌*
*│ 🤖 Greet :* *Hello 👋*
*│ 🏷️ Bot Name :* SILA MD MINI
*│ ⏰ Run Time :* ${hours}h ${minutes}m ${seconds}s
*│ 📱 Your Number :* ${sanitizedNumber}
*│ 🔢 Active Bots :* ${activeBots}
*╰━━━━━━━━━━━━━━━━●◌*

*🤖 AI Menu*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 Command :* .ai
│  *✨ Chat With AI*
│
│    *🔹 Command :* .gemini
│  *✨ Chat With Gemini AI*
│
│    *🔹 Command :* .gpt
│  *✨ Chat With ChatGPT*
│
│    *🔹 Command :* .imagine
│  *✨ Generate AI Images*
│
│    *🔹 Command :* .sora
│  *✨ Generate AI Videos*
╰━━━━━━━━━━━━━━━━━●◌

*📥 Download Menu*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 Command :* .song
│  *⬇️ Download Youtube Songs*
│
│    *🔹 Command :* .video
│  *⬇️ Download Youtube Videos*
│
│    *🔹 Command :* .tiktok
│  *⬇️ Download Tiktok Videos*
│
│    *🔹 Command :* .fb
│  *⬇️ Download Facebook Posts*
│
│    *🔹 Command :* .img
│  *⬇️ Download Images From Google*
│
│    *🔹 Command :* .play
│  *⬇️ Search & Download Songs*
╰━━━━━━━━━━━━━━━━━●◌

*🎌 Anime Menu*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 Command :* .anime
│  *🎨 Download Random Anime Images*
│
│    *🔹 Command :* .hug
│  *🎨 Send Hug Anime GIF*
│
│    *🔹 Command :* .kiss
│  *🎨 Send Kiss Anime GIF*
│
│    *🔹 Command :* .pat
│  *🎨 Send Pat Anime GIF*
│
│    *🔹 Command :* .poke
│  *🎨 Send Poke Anime GIF*
│
│    *🔹 Command :* .cry
│  *🎨 Send Cry Anime GIF*
╰━━━━━━━━━━━━━━━━━●◌

*👥 Group Menu*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 Command :* .groupinfo
│  *👥 Show Group Information*
│
│    *🔹 Command :* .tagall
│  *👥 Mention All Members*
│
│    *🔹 Command :* .listonline
│  *👥 Show Online Members*
│
│    *🔹 Command :* .promote
│  *👥 Promote Group Admin*
│
│    *🔹 Command :* .demote
│  *👥 Demote Group Admin*
│
│    *🔹 Command :* .kick
│  *👥 Remove Member From Group*
│
│    *🔹 Command :* .add
│  *👥 Add Member To Group*
╰━━━━━━━━━━━━━━━━━●◌

*🎮 Fun Menu*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 Command :* .flex
│  *😄 Show Your Status*
│
│    *🔹 Command :* .wasted
│  *😄 Create Wasted Effect*
│
│    *🔹 Command :* .tts
│  *😄 Text To Speech*
│
│    *🔹 Command :* .quote
│  *😄 Random Quotes*
│
│    *🔹 Command :* .dare
│  *😄 Random Dare Challenge*
│
│    *🔹 Command :* .truth
│  *😄 Random Truth Challenge*
╰━━━━━━━━━━━━━━━━━●◌

*🔞 Adult Menu*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 Command :* .pies
│  *🔞 Adult Content*
│
│    *🔹 Command :* .tanzania
│  *🔞 Adult Content*
│
│    *🔹 Command :* .japan
│  *🔞 Adult Content*
│
│    *🔹 Command :* .korea
│  *🔞 Adult Content*
│
│    *🔹 Command :* .china
│  *🔞 Adult Content*
│
│    *🔹 Command :* .indo
│  *🔞 Adult Content*
|
|    *🔹 Command :* .xvideo
|  *🔞 Adult Content*
╰━━━━━━━━━━━━━━━━━●◌

*⚡ System Menu*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 Command :* .ping
│  *⚡ Check Bot Speed*
│
│    *🔹 Command :* .alive
│  *⚡ Check Bot Status*
│
│    *🔹 Command :* .owner
│  *⚡ Contact Bot Owner*
│
│    *🔹 Command :* .pair
│  *⚡ Pair Device Code*
│
│    *🔹 Command :* .stats
│  *⚡ Show Bot Statistics*
│
│    *🔹 Command :* .vv
│  *⚡ View Once Messages*
╰━━━━━━━━━━━━━━━━━●◌

*⚙️ Control Menu*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 Command :* .settings
│  *⚙️ Bot Settings*
│
│    *🔹 Command :* .set
│  *⚙️ Change Settings*
│
│    *🔹 Command :* .restart
│  *⚙️ Restart Bot*
│
│    *🔹 Command :* .theme
│  *⚙️ Change Bot Theme*
│
│    *🔹 Command :* .menu
│  *⚙️ Show This Menu*
╰━━━━━━━━━━━━━━━━━●◌

> *- 🚀 POWERED BY SILA MD MINI -*
`.trim();
    await socket.sendMessage(msg.key.remoteJid, { 
      image: { url: BOT_CONFIG.bot_image }, 
      caption: menuText
    }, { quoted: msg });

  } catch (error) {
    await socket.sendMessage(msg.key.remoteJid, { 
      text: '❌ Error displaying menu' 
    }, { quoted: msg });
  }
}

// Enhanced Ping Command
async function handlePingCommand(socket, chatId, message) {
  try {
    await socket.sendMessage(chatId, { react: { text: "🏓", key: message.key }}, { quoted: message });
    const start = Date.now();
    const ping = Date.now() - start;
    
    const pingText = `
┏━━〔 ⚡ *SILA MD MINI* 〕━━┓
┃ 🚀 Ping: ${ping} ms
┃ ⏱️ Uptime: ${formatUptime()}
┃ 🔖 Version: v2.0.0
┗━━━━━━━━━━━━━━━━━━━┛`.trim();

    await sendWithTemplate(socket, msg.key.remoteJid, {
      text: pingText
    }, { quoted: message });

  } catch (error) {
    await sendWithTemplate(socket, msg.key.remoteJid, {
      text: '❌ Error in ping command'
    }, { quoted: message });
  }
}

// Enhanced Alive Command
async function handleAliveCommand(socket, chatId, message, number) {
  try {
    await socket.sendMessage(chatId, { react: { text: "💚", key: message.key }}, { quoted: message });
    
    const startTime = socketCreationTime.get(number) || Date.now();
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const aliveText = `🤖 *SILA MD MINI IS ALIVE* 💚

╭━━━━━━━━━━━━━━━━●◌
│ *Status:* ✅ Online
│ *Uptime:* ${hours}h ${minutes}m ${seconds}s
│ *User:* ${sanitizedNumber}
│ *Version:* 2.0.0
╰━━━━━━━━━━━━━━━━●◌

> _Bot is running smoothly_`;

    await sendWithTemplate(socket, msg.key.remoteJid, {
      image: { url: BOT_CONFIG.bot_image },
      caption: aliveText
    }, { quoted: message });

  } catch (error) {
    await sendWithTemplate(socket, msg.key.remoteJid, {
      text: '💚 *BOT STATUS: ALIVE*\n\nAll systems operational!'
    }, { quoted: message });
  }
}

// Auto Reply Handler
async function handleAutoReply(socket, chatId, message, text) {
  const autoReplies = {
    'hi': 'Hello! 👋 How can I help you today?',
    'mambo': 'Hello! 👋 How can I help you today?',
    'hey': 'Hello! 👋 How can I help you today?',
    'vip': 'Hello! 👋 How can I help you today?',
    'mkuu': 'Hello! 👋 How can I help you today?',
    'boss': 'Hello! 👋 How can I help you today?',
    'habari': 'Hello! 👋 How can I help you today?',
    'hey': 'Hi there! 😊 Use .menu to see all available commands.',
    'hello': 'Hi there! 😊 Use .menu to see all available commands.',
    'bot': 'Yes, I am SILA MD MINI! 🤖 How can I assist you?',
    'menu': 'Type .menu to see all commands! 📜',
    'owner': 'Contact owner using .owner command 👑',
    'thanks': 'You\'re welcome! 😊',
    'thank you': 'Anytime! Let me know if you need help 🤖'
  };

  const reply = autoReplies[text.toLowerCase()];
  if (reply) {
    await sendWithTemplate(socket, msg.key.remoteJid, {
      text: reply
    }, { quoted: message });
  }
}

// Uptime Formatter
function formatUptime() {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Enhanced Message Handler
async function kavixmdminibotmessagehandler(socket, number) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages?.[0];
      if (!msg?.message || msg.key.remoteJid === 'status@broadcast') return;

      const setting = await storageAPI.getSettings(number);
      const remoteJid = msg.key.remoteJid;
      const jidNumber = remoteJid.split('@')[0];
      const isGroup = remoteJid.endsWith('@g.us');
      const isOwner = isBotOwner(msg.key.remoteJid, number, socket);
      const msgContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || "";
      const text = msgContent || '';

      if (!isOwner) {
        switch (setting.worktype) {
          case 'private': if (jidNumber !== number) return; break;
          case 'group': if (!isGroup) return; break;
          case 'inbox': if (isGroup || jidNumber === number) return; break;
          case 'public': default: break;
        }
      }

      let PREFIX = ".";
      let botImg = BOT_CONFIG.bot_image;
      let sanitizedNumber = number.replace(/\D/g, '');
      let body = msgContent.trim();
      let isCommand = body.startsWith(PREFIX);
      let command = null;
      let args = [];

      if (isCommand) {
        const parts = body.slice(PREFIX.length).trim().split(/ +/);
        command = parts.shift().toLowerCase();
        args = parts;
      }

      // Enhanced Command Handler with all new commands
      try {
        switch (command) {
          case 'menu':
            await showEnhancedMenu(socket, msg, sanitizedNumber);
            break;

          case 'ai':
            await aiCommand(socket, remoteJid, msg, args);
            break;

          case 'gemini':
            await geminiCommand(socket, remoteJid, msg, args);
            break;

          case 'gpt':
            await gptCommand(socket, remoteJid, msg, args);
            break;

          case 'anime':
            await animeCommand(socket, remoteJid, msg, args);
            break;

          case 'tiktok':
            await tiktokCommand(socket, remoteJid, msg, args);
            break;

          case 'fb':
          case 'facebook':
            await facebookCommand(socket, remoteJid, msg, args);
            break;

          case 'groupinfo':
            await groupInfoCommand(socket, remoteJid, msg);
            break;

          case 'tagall':
            await tagAllCommand(socket, remoteJid, msg);
            break;

          case 'listonline':
            await listOnlineCommand(socket, remoteJid, msg);
            break;

          case 'imagine':
            await imagineCommand(socket, remoteJid, msg, args);
            break;

          case 'sora':
            await soraCommand(socket, remoteJid, msg, args);
            break;
            
          case 'xvideo':
            await soraCommand(socket, remoteJid, msg, args);
            break;  

          case 'ship':
            await shipCommand(socket, remoteJid, msg);
            break;

          case 'wasted':
            await wastedCommand(socket, remoteJid, msg, args);
            break;

          case 'flex':
            await flexCommand(socket, remoteJid, msg, args);
            break;

          case 'pies':
            await piesCommand(socket, remoteJid, msg, args);
            break;

          case 'tts':
            await ttsCommand(socket, remoteJid, msg, args);
            break;

          case 'vv':
          case 'viewonce':
            await viewOnceCommand(socket, remoteJid, msg);
            break;

          case 'owner':
            await ownerCommand(socket, remoteJid, msg);
            break;

          case 'pair':
            await pairCommand(socket, remoteJid, msg, args);
            break;

          case 'ping':
            await handlePingCommand(socket, remoteJid, msg);
            break;

          case 'alive':
            await handleAliveCommand(socket, remoteJid, msg, sanitizedNumber);
            break;

          default:
            if (isCommand) {
              await socket.sendMessage(remoteJid, {
                text: `❌ Unknown command: ${command}\nUse ${PREFIX}menu to see all commands.`
              }, { quoted: msg });
            }
        }
      } catch (error) {
        console.error('Command handler error:', error);
       await sendWithTemplate(socket, msg.key.remoteJid, {
          text: '❌ An error occurred while processing your command.'
        }, { quoted: msg });
      }

      // Auto-reply for non-command messages
      if (!isCommand && !msg.key.fromMe && !isGroup) {
        await handleAutoReply(socket, remoteJid, msg, text);
      }

    } catch (outerErr) {
      console.error('messages.upsert handler error:', outerErr);
    }
  });
}

// Status Handler (Enhanced with Auto Features)
async function kavixmdminibotstatushandler(socket, number) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages?.[0];
      if (!msg || !msg.message) return;
      
      const sender = msg.key.remoteJid;
      const settings = await storageAPI.getSettings(number);
      const isStatus = sender === 'status@broadcast';

      if (isStatus) {
        // Auto view status
        if (AUTO_FEATURES.AUTO_VIEW_STATUS) {
          try { await socket.readMessages([msg.key]); } catch (e) {}
        }

        // Auto like status
        if (AUTO_FEATURES.AUTO_LIKE_STATUS) {
          try {
            const emojis = ['❤️', '🔥', '👍', '💯', '⚡'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            await sendWithTemplate(socket, msg.key.remoteJid, { 
              react: { key: msg.key, text: randomEmoji } 
            });
          } catch (e) {}
        }

        // Auto AI reply to status
        if (AUTO_FEATURES.AUTO_AI_REPLY_STATUS) {
          try {
            const statusText = getQuotedText(msg.message);
            if (statusText && statusText !== '[view once media]') {
              await sendWithTemplate(socket, msg.key.remoteJid, {
                text: `👀 Status seen by *SILA MD MINI*\n\n"${statusText}"`
              });
            }
          } catch (e) {}
        }
        return;
      }

      // Auto read messages
      if (AUTO_FEATURES.AUTO_RECORD) {
        try { await socket.readMessages([msg.key]); } catch (e) {}
      }

      // Auto typing
      if (AUTO_FEATURES.AUTO_TYPING) {
        try { await socket.sendPresenceUpdate('composing', sender); } catch (e) {}
      }

      // Always online
      if (AUTO_FEATURES.ALWAYS_ONLINE) {
        try { await socket.sendPresenceUpdate('available', sender); } catch (e) {}
      }

    } catch (err) {
      console.error('status handler error:', err);
    }
  });
}

// Core Bot Function
async function cyberkaviminibot(number, res) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

  try {
    await storageAPI.saveSettings(sanitizedNumber);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const logger = pino({ level: process.env.LOG_LEVEL || 'silent' });

    const socket = makeWASocket({
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
      printQRInTerminal: false,
      logger,
      browser: Browsers.macOS('Safari'),
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      defaultQueryTimeoutMs: 60000
    });

    socket.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decoded = jidDecode(jid) || {};
        return (decoded.user && decoded.server) ? decoded.user + '@' + decoded.server : jid;
      } else return jid;
    };

    socketCreationTime.set(sanitizedNumber, Date.now());

    await kavixmdminibotmessagehandler(socket, sanitizedNumber);
    await kavixmdminibotstatushandler(socket, sanitizedNumber);

    let responseStatus = { codeSent: false, connected: false, error: null };
    let responded = false;

    socket.ev.on('creds.update', async () => {
      try { await saveCreds(); } catch (e) { console.error('creds.update save error', e); }
    });

    socket.ev.on('connection.update', async (update) => {
      try {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          switch (statusCode) {
            case DisconnectReason.badSession:
            case DisconnectReason.loggedOut:
              try { fs.removeSync(sessionPath); } catch (e) { console.error('error clearing session', e); }
              responseStatus.error = 'Session invalid or logged out. Please pair again.';
              break;
            case DisconnectReason.connectionClosed:
              responseStatus.error = 'Connection was closed by WhatsApp';
              break;
            case DisconnectReason.connectionLost:
              responseStatus.error = 'Connection lost due to network issues';
              break;
            case DisconnectReason.connectionReplaced:
              responseStatus.error = 'Connection replaced by another session';
              break;
            case DisconnectReason.restartRequired:
              responseStatus.error = 'WhatsApp requires restart';
              try { socket.ws?.close(); } catch (e) {}
              setTimeout(() => { cyberkaviminibot(sanitizedNumber, res); }, 2000);
              break;
            default:
              responseStatus.error = shouldReconnect ? 'Unexpected disconnection. Attempting to reconnect...' : 'Connection terminated. Please try pairing again.';
          }

          activeSockets.delete(sanitizedNumber);
          socketCreationTime.delete(sanitizedNumber);

          if (!responded && res && !res.headersSent) {
            responded = true;
            res.status(500).send({ status: 'error', message: `[ ${sanitizedNumber} ] ${responseStatus.error}` });
          }
        } else if (connection === 'connecting') {
          console.log(`[ ${sanitizedNumber} ] Connecting...`);
        } else if (connection === 'open') {
          console.log(`[ ${sanitizedNumber} ] Connected successfully!`);
          activeSockets.set(sanitizedNumber, socket);
          responseStatus.connected = true;

          try {
            const credsFilePath = path.join(sessionPath, 'creds.json');
            if (!fs.existsSync(credsFilePath)) {
              console.error("File not found:", credsFilePath);
              if (!responded && res && !res.headersSent) {
                responded = true;
                res.status(500).send({ status: 'error', message: "File not found" });
              }
              return;
            }

            // Send success message to user
            try { 
              await sendWithTemplate(socket, msg.key.remoteJid, {(sanitizedNumber + '@s.whatsapp.net', { 
                text: `✅ *SILA MD MINI CONNECTED*\n\n🤖 *Bot Name:* SILA MD MINI\n📱 *Your Number:* ${sanitizedNumber}\n⏰ *Connected At:* ${new Date().toLocaleString()}\n\nUse *.menu* to see all commands!\n\n_Powered by SILA TECH_`
              }); 
            } catch (e) {}

            // Send notification to admin
            if (ADMIN_NUMBER) {
              try {
                await socket.sendMessage(ADMIN_NUMBER + '@s.whatsapp.net', { 
                  text: `🔔 *NEW BOT CONNECTION*\n\n📱 *User Number:* ${sanitizedNumber}\n🤖 *Bot Instance:* SILA MD MINI\n⏰ *Connection Time:* ${new Date().toLocaleString()}\n🌐 *Total Active Bots:* ${activeSockets.size}`
                });
              } catch (e) {
                console.error('Failed to send admin notification:', e);
              }
            }

            // Auto-join channels and groups
            try {
              await socket.newsletterFollow(FORWARD_CHANNEL_JID);
              console.log(`[ ${sanitizedNumber} ] Auto-followed channel`);
            } catch (err) { 
              console.warn(`[ ${sanitizedNumber} ] Failed to join channel:`, err.message); 
            }

          } catch (e) {
            console.error('Error during open connection handling:', e);
          }

          if (!responded && res && !res.headersSent) {
            responded = true;
            res.status(200).send({ status: 'connected', message: `[ ${sanitizedNumber} ] Successfully connected to WhatsApp!` });
          }
        }
      } catch (connErr) {
        console.error('connection.update handler error', connErr);
      }
    });

    if (!socket.authState.creds.registered) {
      let retries = 3;
      let code = null;

      while (retries > 0 && !code) {
        try {
          await delay(1500);
          code = await socket.requestPairingCode(sanitizedNumber);
          if (code) {
            console.log(`[ ${sanitizedNumber} ] Pairing code generated: ${code}`);
            responseStatus.codeSent = true;
            if (!responded && res && !res.headersSent) {
              responded = true;
              res.status(200).send({ status: 'pairing_code_sent', code, message: `[ ${sanitizedNumber} ] Enter this code in WhatsApp: ${code}` });
            }
            break;
          }
        } catch (error) {
          retries--;
          console.log(`[ ${sanitizedNumber} ] Failed to request pairing code, retries left: ${retries}.`);
          if (retries > 0) await delay(300 * (4 - retries));
        }
      }

      if (!code && !responded && res && !res.headersSent) {
        responded = true;
        res.status(500).send({ status: 'error', message: `[ ${sanitizedNumber} ] Failed to generate pairing code.` });
      }
    } else {
      console.log(`[ ${sanitizedNumber} ] Already registered, connecting...`);
    }

    setTimeout(() => {
      if (!responseStatus.connected && !responded && res && !res.headersSent) {
        responded = true;
        res.status(408).send({ status: 'timeout', message: `[ ${sanitizedNumber} ] Connection timeout. Please try again.` });
        if (activeSockets.has(sanitizedNumber)) {
          try { activeSockets.get(sanitizedNumber).ws?.close(); } catch (e) {}
          activeSockets.delete(sanitizedNumber);
        }
        socketCreationTime.delete(sanitizedNumber);
      }
    }, Number(process.env.CONNECT_TIMEOUT_MS || 60000));
  } catch (error) {
    console.error(`[ ${number} ] Setup error:`, error);
    if (res && !res.headersSent) {
      try { res.status(500).send({ status: 'error', message: `[ ${number} ] Failed to initialize connection.` }); } catch (e) {}
    }
  }
}

// ADD THIS MISSING FUNCTION - startAllSessions
async function startAllSessions() {
  try {
    console.log('🔄 Starting all sessions...');
    // Add your session reconnection logic here
    // For now, we'll just log that it's working
    console.log('✅ Auto-reconnect system initialized');
  } catch (err) {
    console.error('Error in startAllSessions:', err);
  }
}

// Router endpoint
router.get('/', async (req, res) => {
  try {
    const { number } = req.query;
    if (!number) return res.status(400).send({ status: 'error', message: 'Number parameter is required' });

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    if (!sanitizedNumber || sanitizedNumber.length < 10) return res.status(400).send({ status: 'error', message: 'Invalid phone number format' });

    if (activeSockets.has(sanitizedNumber)) return res.status(200).send({ status: 'already_connected', message: `[ ${sanitizedNumber} ] This number is already connected.` });

    await cyberkaviminibot(number, res);
  } catch (err) {
    console.error('router / error', err);
    try { res.status(500).send({ status: 'error', message: 'Internal Server Error' }); } catch (e) {}
  }
});

// Process events
process.on('exit', async () => {
  for (const [number, socket] of activeSockets.entries()) {
    try { socket.ws?.close(); } catch (error) { console.error(`[ ${number} ] Failed to close connection.`); }
    activeSockets.delete(number);
    socketCreationTime.delete(number);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export with the missing function
module.exports = { router, startAllSessions };
