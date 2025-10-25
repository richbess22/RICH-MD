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
╔══════════════════════════════╗
🚀 *BOT OVERVIEW*
⏰ Runtime: ${hours}h ${minutes}m ${seconds}s
📱 Your Number: ${number}
🔢 Active Bots: ${activeBots}
╚══════════════════════════════╝
┌─🤖 𝔸𝕀 𝕄𝕆𝔻𝕌𝕃𝔼─────────────────┐
│ 🤖 .𝕒𝕚                        │
│ 🔮 .𝕘𝕖𝕞𝕚𝕟𝕚                    │
│ 💬 .𝕘𝕡𝕥                      │
│ 🎨 .𝕚𝕞𝕒𝕘𝕚𝕟𝕖                  │
│ 🎥 .𝕤𝕠𝕣𝕒                      │
└───────────────────────────────┘

┌─📥 𝔻𝕆𝕎ℕ𝕃𝕆𝔸𝔻─────────────────┐
│ 🎵 .𝕤𝕠𝕟𝕘                      │
│ 🎥 .𝕧𝕚𝕕𝕖𝕠                    │
│ 📱 .𝕥𝕚𝕜𝕥𝕠𝕜                    │
│ 📘 .𝕗𝕓                        │
│ 🎶 .𝕡𝕝𝕒𝕪                      │
│ 🖼️ .𝕚𝕞𝕘                       │
└───────────────────────────────┘

┌─🎌 𝔸ℕ𝕀𝕄𝔼─────────────────────┐
│ 🎌 .𝕒𝕟𝕚𝕞𝕖                    │
│ 🤗 .𝕙𝕦𝕘                       │
│ 💋 .𝕜𝕚𝕤𝕤                      │
│ 🥰 .𝕡𝕒𝕥                       │
│ 👉 .𝕡𝕠𝕜𝕖                      │
│ 😢 .𝕔𝕣𝕪                       │
└───────────────────────────────┘

┌─👥 𝔾ℝ𝕆𝕌ℙ─────────────────────┐
│ ℹ️ .𝕘𝕣𝕠𝕦𝕡𝕚𝕟𝕗𝕠                 │
│ 🔊 .𝕥𝕒𝕘𝕒𝕝𝕝                    │
│ 🟢 .𝕝𝕚𝕤𝕥𝕠𝕟𝕝𝕚𝕟𝕖                │
│ 💘 .𝕤𝕙𝕚𝕡                       │
│ 👑 .𝕡𝕣𝕠𝕞𝕠𝕥𝕖                   │
│ ⬇️ .𝕕𝕖𝕞𝕠𝕥𝕖                    │
│ 👢 .𝕜𝕚𝕔𝕜                       │
│ ➕ .𝕒𝕕𝕕                        │
└───────────────────────────────┘

┌─🎮 𝔽𝕌ℕ───────────────────────┐
│ 💪 .𝕗𝕝𝕖𝕩                      │
│ 💀 .𝕨𝕒𝕤𝕥𝕖𝕕                    │
│ 🗣️ .𝕥𝕥𝕤                       │
│ 🃏 .𝕢𝕦𝕠𝕥𝕖                     │
│ 🎯 .𝕕𝕒𝕣𝕖                       │
│ 🤔 .𝕥𝕣𝕦𝕥𝕙                     │
└───────────────────────────────┘

┌─🔞 𝔸𝔻𝕌𝕃𝕋────────────────────┐
│ 🔞 .𝕡𝕚𝕖𝕤                      │
│ 🇹🇿 .𝕥𝕒𝕟𝕫𝕒𝕟𝕚𝕒                 │
│ 🇯🇵 .𝕛𝕒𝕡𝕒𝕟                     │
│ 🇰🇷 .𝕜𝕠𝕣𝕖𝕒                     │
│ 🇨🇳 .𝕔𝕙𝕚𝕟𝕒                     │
│ 🇮🇩 .𝕚𝕟𝕕𝕠                      │
└───────────────────────────────┘

┌─⚡ 𝕊𝕐𝕊𝕋𝔼𝕄───────────────────┐
│ 🏓 .𝕡𝕚𝕟𝕘                      │
│ 💚 .𝕒𝕝𝕚𝕧𝕖                     │
│ 👑 .𝕠𝕨𝕟𝕖𝕣                     │
│ 🔗 .𝕡𝕒𝕚𝕣                      │
│ 🔍 .𝕧𝕧                         │
│ 📊 .𝕤𝕥𝕒𝕥𝕤                     │
└───────────────────────────────┘

┌─⚙️ ℂ𝕆ℕ𝕋ℝ𝕆𝕃──────────────────┐
│ ⚙️ .𝕤𝕖𝕥𝕥𝕚𝕟𝕘𝕤                  │
│ 🔧 .𝕤𝕖𝕥                       │
│ 🔄 .𝕣𝕖𝕤𝕥𝕒𝕣𝕥                   │
│ 🎨 .𝕥𝕙𝕖𝕞𝕖                     │
│ 📝 .𝕞𝕖𝕟𝕦                      │
└───────────────────────────────┘

╔══════════════════════════════╗
║        🔧 𝕊𝕀𝕃𝔸 𝕋𝔼ℂℍ         ║
╚══════════════════════════════╝
_POWERED BY SILA MD_`;

    await sendWithTemplate(socket, msg.key.remoteJid, {
      image: { url: BOT_CONFIG.bot_image },
      caption: menuText
    }, msg);
 const replygckavi = async (teks) => {
            await socket.sendMessage(sender, {
                text: teks,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 99999999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: FORWARD_CHANNEL_JID,
                        newsletterName: 'SILA TECH',
                        serverMessageId: 1,
                    },
                    externalAdReply: { 
                        title: "SILA MD MINI",
                        body: "𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳",
                        thumbnailUrl: botImg,
                        sourceUrl: "https://whatsapp.com/channel/0029VbBPxQTJUM2WCZLB6j28",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }                       
                }
            }, { quoted: msg });
        }; 
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

    const aliveText =┏━━ `🤖 *SILA MD MINI IS ALIVE* 💚

✅ Status: Online
⏰ Uptime: ${hours}h ${minutes}m ${seconds}s
📱 User: ${number}
🔧 Version: 2.0.0
🚀 Features: All Systems Operational
┗━━━━━━━━━━━━━━━━━━━┛
_POWERED BY SILA MD_`;

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
    'hi': 'mambo': 'vip': 'Hello! 👋 How can I help you today?',
    'hey': 'Hi there! 😊 Use .menu to see all available commands.',
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
            const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '🖤', '💚'];
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
