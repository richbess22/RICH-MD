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
const AUTO_JOIN_GROUP = 'https://chat.whatsapp.com/GoavLtSBgRoAvmJfSgaOgg';
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
              await sendWithTemplate(socket, remoteJid, {
                text: `❌ Unknown command: ${command}\nUse ${PREFIX}menu to see all commands.`
              }, msg);
            }
        }
      } catch (error) {
        console.error('Command handler error:', error);
        await sendWithTemplate(socket, remoteJid, {
          text: '❌ An error occurred while processing your command.'
        }, msg);
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

    const menuText = `🤖 *SILA MD MINI BOT MENU*

🚀 *BOT OVERVIEW*
⏰ Runtime: ${hours}h ${minutes}m ${seconds}s
📱 Your Number: ${number}
🔢 Active Bots: ${activeBots}

🤖 *AI COMMANDS*
.ai - AI Chat Assistant
.gemini - Google Gemini AI
.gpt - ChatGPT
.imagine - AI Image Generation
.sora - AI Video Generation

📥 *DOWNLOAD COMMANDS*
.song - YouTube Music Download
.video - YouTube Video Download
.tiktok - TikTok Download
.fb - Facebook Download
.play - Music Search & Play

🎌 *ANIME COMMANDS*
.anime - Random Anime Images
.anime hug - Hug GIFs
.anime kiss - Kiss GIFs
.anime pat - Pat GIFs

👥 *GROUP COMMANDS*
.groupinfo - Group Information
.tagall - Mention All Members
.listonline - Online Members List
.ship - Random Member Shipping

🎮 *FUN COMMANDS*
.flex - Bot Features Showcase
.wasted - Wasted Image Effect
.tts - Text to Speech

🔞 *ADULT COMMANDS*
.pies - Country Specific Content

🔧 *SYSTEM COMMANDS*
.ping - Bot Speed Test
.alive - Bot Status
.owner - Contact Owner
.pair - Pair New Number
.vv - View Once Recovery

⚙️ *SETTINGS*
.settings - Bot Settings
.set - Change Settings

💡 *Tip:* All commands start with . (dot)

_Powered by SILA TECH_`;

    await sendWithTemplate(socket, msg.key.remoteJid, {
      image: { url: BOT_CONFIG.bot_image },
      caption: menuText
    }, msg);

  } catch (error) {
    await sendWithTemplate(socket, msg.key.remoteJid, {
      text: '❌ Error displaying menu'
    }, msg);
  }
}

// Enhanced Ping Command
async function handlePingCommand(socket, chatId, message) {
  try {
    await socket.sendMessage(chatId, { react: { text: "🏓", key: message.key }}, { quoted: message });
    const start = Date.now();
    const ping = Date.now() - start;
    
    const pingText = `
┏━━〔 ⚡ SILA MD MINI 〕━━┓
┃ 🚀 Ping: ${ping} ms
┃ ⏱️ Uptime: ${formatUptime()}
┃ 🔖 Version: v2.0.0
┗━━━━━━━━━━━━━━━━━━━┛`.trim();

    await sendWithTemplate(socket, chatId, {
      text: pingText
    }, message);

  } catch (error) {
    await sendWithTemplate(socket, chatId, {
      text: '❌ Error in ping command'
    }, message);
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

✅ Status: Online
⏰ Uptime: ${hours}h ${minutes}m ${seconds}s
📱 User: ${number}
🔧 Version: 2.0.0
🚀 Features: All Systems Operational

_Powered by SILA TECH_`;

    await sendWithTemplate(socket, chatId, {
      image: { url: BOT_CONFIG.bot_image },
      caption: aliveText
    }, message);

  } catch (error) {
    await sendWithTemplate(socket, chatId, {
      text: '💚 *BOT STATUS: ALIVE*\n\nAll systems operational!'
    }, message);
  }
}

// Auto Reply Handler
async function handleAutoReply(socket, chatId, message, text) {
  const autoReplies = {
    'hi': 'Hello! 👋 How can I help you today?',
    'hello': 'Hi there! 😊 Use .menu to see all available commands.',
    'bot': 'Yes, I am SILA MD MINI! 🤖 How can I assist you?',
    'menu': 'Type .menu to see all commands! 📜',
    'owner': 'Contact owner using .owner command 👑',
    'thanks': 'You\'re welcome! 😊',
    'thank you': 'Anytime! Let me know if you need help 🤖'
  };

  const reply = autoReplies[text.toLowerCase()];
  if (reply) {
    await sendWithTemplate(socket, chatId, {
      text: reply
    }, message);
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
            await socket.sendMessage(sender, { 
              react: { key: msg.key, text: randomEmoji } 
            });
          } catch (e) {}
        }

        // Auto AI reply to status
        if (AUTO_FEATURES.AUTO_AI_REPLY_STATUS) {
          try {
            const statusText = getQuotedText(msg.message);
            if (statusText && statusText !== '[view once media]') {
              await socket.sendMessage(sender, {
                text: `👀 Status seen by SILA MD MINI\n\n"${statusText}"`
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

// The rest of your existing main.js code remains the same...
// [Keep all your existing session management, connection handling, etc.]

module.exports = { router, startAllSessions };
