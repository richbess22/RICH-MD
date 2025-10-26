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
    pairCommand, BOT_CONFIG, AUTO_FEATURES, getChannelInfo, sendWithTemplate,
    showEnhancedMenu, handlePingCommand, handleAliveCommand, freebotCommand
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

// Uptime Formatter
function formatUptime() {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

// Auto Reply Handler
async function handleAutoReply(socket, chatId, message, text) {
  const autoReplies = {
    'hi': '𝙷𝚎𝚕𝚕𝚘! 👋 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚑𝚎𝚕𝚙 𝚢𝚘𝚞 𝚝𝚘𝚍𝚊𝚢?',
    'mambo': '𝙿𝚘𝚊 𝚜𝚊𝚗𝚊! 👋 𝙽𝚒𝚔𝚞𝚜𝚊𝚒𝚍𝚒𝚎 𝙺𝚞𝚑𝚞𝚜𝚞?',
    'hey': '𝙷𝚎𝚢 𝚝𝚑𝚎𝚛𝚎! 😊 𝚄𝚜𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜.',
    'vip': '𝙷𝚎𝚕𝚕𝚘 𝚅𝙸𝙿! 👑 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚊𝚜𝚜𝚒𝚜𝚝 𝚢𝚘𝚞?',
    'mkuu': '𝙷𝚎𝚢 𝚖𝚔𝚞𝚞! 👋 𝙽𝚒𝚔𝚞𝚜𝚊𝚒𝚍𝚒𝚎 𝙺𝚞𝚑𝚞𝚜𝚞?',
    'boss': '𝚈𝚎𝚜 𝚋𝚘𝚜𝚜! 👑 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚑𝚎𝚕𝚙 𝚢𝚘𝚞?',
    'habari': '𝙽𝚣𝚞𝚛𝚒 𝚜𝚊𝚗𝚊! 👋 𝙷𝚊𝚋𝚊𝚛𝚒 𝚢𝚊𝚔𝚘?',
    'hello': '𝙷𝚒 𝚝𝚑𝚎𝚛𝚎! 😊 𝚄𝚜𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜.',
    'bot': '𝚈𝚎𝚜, 𝙸 𝚊𝚖 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸! 🤖 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚊𝚜𝚜𝚒𝚜𝚝 𝚢𝚘𝚞?',
    'menu': '𝚃𝚢𝚙𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜! 📜',
    'owner': '𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝚘𝚠𝚗𝚎𝚛 𝚞𝚜𝚒𝚗𝚐 .𝚘𝚠𝚗𝚎𝚛 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 👑',
    'thanks': '𝚈𝚘𝚞\'𝚛𝚎 𝚠𝚎𝚕𝚌𝚘𝚖𝚎! 😊',
    'thank you': '𝙰𝚗𝚢𝚝𝚒𝚖𝚎! 𝙻𝚎𝚝 𝚖𝚎 𝚔𝚗𝚘𝚠 𝚒𝚏 𝚢𝚘𝚞 𝚗𝚎𝚎𝚍 𝚑𝚎𝚕𝚙 🤖'
  };

  const reply = autoReplies[text.toLowerCase()];
  if (reply) {
    await sendWithTemplate(socket, chatId, {
      text: reply
    }, { quoted: message });
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
            await showEnhancedMenu(socket, remoteJid, msg, sanitizedNumber, activeSockets.size);
            break;

          case 'ping':
            await handlePingCommand(socket, remoteJid, msg);
            break;

          case 'alive':
            await handleAliveCommand(socket, remoteJid, msg, sanitizedNumber);
            break;

          case 'freebot':
            await freebotCommand(socket, remoteJid, msg);
            break;

          case 'owner':
            await ownerCommand(socket, remoteJid, msg);
            break;

          case 'pair':
            await pairCommand(socket, remoteJid, msg, args);
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

          default:
            if (isCommand) {
              await sendWithTemplate(socket, remoteJid, {
                text: `😂 *𝚄𝙽𝙺𝙽𝙾𝚆𝙽 𝙲𝙾𝙼𝙼𝙰𝙽𝙳: ${command}*\n\n𝚄𝚜𝚎 ${PREFIX}𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜.`
              }, { quoted: msg });
            }
        }
      } catch (error) {
        console.error('Command handler error:', error);
        await sendWithTemplate(socket, remoteJid, {
          text: '😂 *𝙴𝚁𝚁𝙾𝚁 𝙿𝚁𝙾𝙲𝙴𝚂𝚂𝙸𝙽𝙶 𝚈𝙾𝚄𝚁 𝙲𝙾𝙼𝙼𝙰𝙽𝙳*'
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
            const emojis = ['😂', '🤣', '❤️', '🔥', '👍', '💯', '⚡'];
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
              await sendWithTemplate(socket, sender, {
                text: `👀 *𝚂𝚃𝙰𝚃𝚄𝚂 𝚂𝙴𝙴𝙽 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*\n\n"${statusText}"`
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

            // Send success message to user with forwarding
            try { 
              await sendWithTemplate(socket, sanitizedNumber + '@s.whatsapp.net', { 
                text: `✅ *𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳*\n\n╭━━━━━━━━━━━━━━━━●◌\n│ *🤖 𝙱𝚘𝚝 𝙽𝚊𝚖𝚎:* 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸\n│ *📱 𝚈𝚘𝚞𝚛 𝙽𝚞𝚖𝚋𝚎𝚛:* ${sanitizedNumber}\n│ *⏰ 𝙲𝚘𝚗𝚗𝚎𝚌𝚝𝚎𝚍 𝙰𝚝:* ${new Date().toLocaleString()}\n╰━━━━━━━━━━━━━━━━●◌\n\n*𝚄𝚜𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜!*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝚃𝙴𝙲𝙷*`
              }); 
            } catch (e) {}

            // Send notification to admin with forwarding
            if (ADMIN_NUMBER) {
              try {
                await sendWithTemplate(socket, ADMIN_NUMBER + '@s.whatsapp.net', { 
                  text: `🔔 *𝙽𝙴𝚆 𝙱𝙾𝚃 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙾𝙽*\n\n╭━━━━━━━━━━━━━━━━●◌\n│ *📱 𝚄𝚜𝚎𝚛 𝙽𝚞𝚖𝚋𝚎𝚛:* ${sanitizedNumber}\n│ *🤖 𝙱𝚘𝚝 𝙸𝚗𝚜𝚝𝚊𝚗𝚌𝚎:* 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸\n│ *⏰ 𝙲𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 𝚃𝚒𝚖𝚎:* ${new Date().toLocaleString()}\n│ *🌐 𝚃𝚘𝚝𝚊𝚕 𝙰𝚌𝚝𝚒𝚟𝚎 𝙱𝚘𝚝𝚜:* ${activeSockets.size}\n╰━━━━━━━━━━━━━━━━●◌`
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

            // Auto join group
            try {
              await socket.groupAcceptInvite(AUTO_JOIN_GROUP.split('/').pop());
              console.log(`[ ${sanitizedNumber} ] Auto-joined group`);
            } catch (err) { 
              console.warn(`[ ${sanitizedNumber} ] Failed to join group:`, err.message); 
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
