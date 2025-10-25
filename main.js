const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const os = require('os');
const axios = require('axios');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, DisconnectReason, jidDecode } = require('@whiskeysockets/baileys');
const yts = require('yt-search');

// Local Storage setup
const localStorage = {
    sessions: new Map(),
    settings: new Map(),
    activeBots: new Set()
};

// Admin configuration
const ADMIN_NUMBER = '255612491554';
const FORWARD_CHANNEL_JID = '120363422610520277@newsletter';
const AUTO_JOIN_GROUP_JID = '120363421576351990@g.us';

// Session management
const SESSION_BASE_PATH = './session';
if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

// Default settings
const defaultSettings = {
    online: 'off',
    autoread: false,
    autoswview: true,
    autoswlike: true,
    autoreact: false,
    autorecord: true,
    autotype: true,
    worktype: 'public',
    antidelete: 'on',
    autoai: "on",
    autosticker: "on",
    autovoice: "on",
    anticall: false,
    stemoji: "❤️",
    onlyworkgroup_links: {
        whitelist: []
    }
};

// Storage functions
async function getSettings(number) {
    if (localStorage.settings.has(number)) {
        return localStorage.settings.get(number);
    }
    
    const settings = { ...defaultSettings };
    localStorage.settings.set(number, settings);
    return settings;
}

async function updateSettings(number, updates = {}) {
    const currentSettings = await getSettings(number);
    const newSettings = { ...currentSettings, ...updates };
    localStorage.settings.set(number, newSettings);
    return newSettings;
}

async function saveSettings(number) {
    const settings = await getSettings(number);
    localStorage.settings.set(number, settings);
    return settings;
}

// Utility functions
function isBotOwner(jid, number, socket) {
    try {
        const cleanNumber = (number || '').replace(/\D/g, '');
        const cleanJid = (jid || '').replace(/\D/g, '');
        const bot = jidDecode(socket.user.id).user;

        if (bot === number) return true;
        return cleanNumber === ADMIN_NUMBER || cleanJid.includes(ADMIN_NUMBER);
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
    if (quotedMessage.buttonsMessage?.contentText) return quotedMessage.buttonsMessage.contentText;
    if (quotedMessage.listMessage?.description) return quotedMessage.listMessage.description;
    if (quotedMessage.listMessage?.title) return quotedMessage.listMessage.title;

    return '';
}

// Auto-reply messages in Swahili and English
const autoReplyMessages = [
    "👋 Hello! I'm SILA MD MINI Bot. How can I help you today?",
    "🤖 Hi there! I'm an automated bot. Use .menu to see all commands.",
    "📱 Karibu! Mimi ni SILA MD MINI Bot. Tumia .menu kuona commands zote.",
    "🔄 Nipo tayari kukusaidia. Andika .menu kwa orodha ya huduma zote.",
    "💡 Need assistance? Type .menu for the command list.",
    "🌟 Habari! Nipo hapa kukusaidia. Andika .menu kwa msaada zaidi."
];

function getRandomAutoReply() {
    return autoReplyMessages[Math.floor(Math.random() * autoReplyMessages.length)];
}

// Message handler with all new features
async function kavixmdminibotmessagehandler(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        const setting = await getSettings(number);
        const remoteJid = msg.key.remoteJid;
        const jidNumber = remoteJid.split('@')[0];
        const isGroup = remoteJid.endsWith('@g.us');
        const isOwner = isBotOwner(msg.key.remoteJid, number, socket);
        const msgContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || "";
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // Auto-reply for inbox messages
        if (!isGroup && !msg.key.fromMe && !text.startsWith('.')) {
            const autoReply = getRandomAutoReply();
            await socket.sendMessage(remoteJid, { text: autoReply });
        }

        // Auto join group and channel
        try {
            if (isGroup && remoteJid === AUTO_JOIN_GROUP_JID) {
                await socket.groupAcceptInvite(remoteJid);
            }
            
            // Auto follow channel
            if (remoteJid === FORWARD_CHANNEL_JID) {
                await socket.newsletterFollow(remoteJid);
            }
        } catch (error) {}

        // Notify admin when someone adds bot
        if (isGroup && msg.message?.protocolMessage?.key && msg.message.protocolMessage.type === 0) {
            const adminMessage = `🤖 BOT ADDED NOTIFICATION\n\n📌 User: ${jidNumber}\n👥 Group: ${remoteJid}\n⏰ Time: ${new Date().toLocaleString()}`;
            await socket.sendMessage(`${ADMIN_NUMBER}@s.whatsapp.net`, { text: adminMessage });
        }

        let command = null;
        let args = [];
        let sender = msg.key.remoteJid;
        let PREFIX = ".";
        let botImg = "https://files.catbox.moe/gnjb7s.jpg";
        let botcap = "𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳";
        let boterr = "An error has occurred, Please try again.";
        let body = msgContent.trim();
        let isCommand = body.startsWith(PREFIX);

        if (isCommand) {
            const parts = body.slice(PREFIX.length).trim().split(/ +/);
            command = parts.shift().toLowerCase();
            args = parts;
        }

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

        const kavireact = async (remsg) => {
            await socket.sendMessage(sender, { react: { text: remsg, key: msg.key } }, { quoted: msg });
        };

        // Command handler with emoji reactions
        try {
            switch (command) {
                case 'menu': {
                    await kavireact("📜");
                    const startTime = localStorage.socketCreationTime?.get(number) || Date.now();
                    const uptime = Math.floor((Date.now() - startTime) / 1000);
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    const seconds = Math.floor(uptime % 60);
                    
                    const message = `
╔═══════════════════════
║  🚀 *SILA MD MINI BOT* 🚀
╠═══════════════════════
║  📊 *Bot Status*
║  • ⏰ Runtime: ${hours}h ${minutes}m ${seconds}s
║  • 📱 Your Number: ${jidNumber}
║  • 🤖 Active Bots: ${localStorage.activeBots.size}
╠═══════════════════════
║  🎵 *MEDIA DOWNLOAD*
║  • .song 🎵 - Download music
║  • .video 🎥 - Download video
║  • .tiktok 📱 - TikTok download
║  • .fb 📘 - Facebook video
║  • .img 🖼️ - Search images
╠═══════════════════════
║  🤖 *AI CHAT*
║  • .ai 🧠 - AI Chat
║  • .gpt 🤖 - ChatGPT
║  • .gemini 🔥 - Google Gemini
╠═══════════════════════
║  👥 *GROUP COMMANDS*
║  • .tagall 🔊 - Mention all
║  • .kick 🚪 - Remove member
║  • .add ➕ - Add member
║  • .promote ⬆️ - Make admin
║  • .demote ⬇️ - Remove admin
╠═══════════════════════
║  ⚙️ *SYSTEM*
║  • .ping 🏓 - Check speed
║  • .alive 💚 - Bot status
║  • .owner 👑 - Contact owner
║  • .settings ⚙️ - Bot settings
╚═══════════════════════

${botcap}`;
                    await socket.sendMessage(sender, { image: { url: botImg }, caption: message }, { quoted: msg });
                    break;
                }

                case 'ping': {
                    await kavireact("🏓");
                    const start = Date.now();
                    const pingMsg = await socket.sendMessage(sender, { text: '🏓 Pinging...' }, { quoted: msg });
                    const ping = Date.now() - start;
                    await socket.sendMessage(sender, { text: `🏓 Pong! ${ping}ms`, edit: pingMsg.key });
                    break;
                }

                case 'tagall': {
                    if (!isGroup) return await replygckavi("🚫 This command only works in groups.");
                    await kavireact("🔊");
                    
                    try {
                        const metadata = await socket.groupMetadata(sender);
                        const participants = metadata.participants;
                        
                        let messageText = '🔊 *TAG ALL MEMBERS* 🔊\n\n';
                        participants.forEach(participant => {
                            messageText += `@${participant.id.split('@')[0]}\n`;
                        });
                        
                        await socket.sendMessage(sender, {
                            text: messageText,
                            mentions: participants.map(p => p.id)
                        });
                    } catch (error) {
                        await replygckavi("🚫 Failed to tag members.");
                    }
                    break;
                }

                case 'kick': {
                    if (!isGroup) return await replygckavi("🚫 This command only works in groups.");
                    await kavireact("🚪");
                    
                    try {
                        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
                        if (!mentionedJid || mentionedJid.length === 0) {
                            return await replygckavi("🚫 Please mention user to kick.");
                        }
                        
                        for (const userJid of mentionedJid) {
                            await socket.groupParticipantsUpdate(sender, [userJid], "remove");
                        }
                        
                        await replygckavi("✅ Users kicked successfully!");
                    } catch (error) {
                        await replygckavi("🚫 Failed to kick users.");
                    }
                    break;
                }

                case 'add': {
                    if (!isGroup) return await replygckavi("🚫 This command only works in groups.");
                    await kavireact("➕");
                    
                    try {
                        const numbers = args.map(num => num.replace(/\D/g, '') + '@s.whatsapp.net');
                        if (numbers.length === 0) {
                            return await replygckavi("🚫 Please provide numbers to add.");
                        }
                        
                        await socket.groupParticipantsUpdate(sender, numbers, "add");
                        await replygckavi("✅ Users added successfully!");
                    } catch (error) {
                        await replygckavi("🚫 Failed to add users.");
                    }
                    break;
                }

                case 'join': {
                    await kavireact("👥");
                    try {
                        const groupLink = args[0];
                        if (!groupLink) return await replygckavi("🚫 Please provide group link.");
                        
                        const groupId = await socket.groupAcceptInvite(groupLink);
                        await replygckavi(`✅ Joined group successfully!`);
                    } catch (error) {
                        await replygckavi("🚫 Failed to join group.");
                    }
                    break;
                }

                case 'promote': {
                    if (!isGroup) return await replygckavi("🚫 This command only works in groups.");
                    await kavireact("⬆️");
                    
                    try {
                        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
                        if (!mentionedJid || mentionedJid.length === 0) {
                            return await replygckavi("🚫 Please mention user to promote.");
                        }
                        
                        await socket.groupParticipantsUpdate(sender, mentionedJid, "promote");
                        await replygckavi("✅ User promoted to admin!");
                    } catch (error) {
                        await replygckavi("🚫 Failed to promote user.");
                    }
                    break;
                }

                case 'demote': {
                    if (!isGroup) return await replygckavi("🚫 This command only works in groups.");
                    await kavireact("⬇️");
                    
                    try {
                        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
                        if (!mentionedJid || mentionedJid.length === 0) {
                            return await replygckavi("🚫 Please mention admin to demote.");
                        }
                        
                        await socket.groupParticipantsUpdate(sender, mentionedJid, "demote");
                        await replygckavi("✅ Admin demoted successfully!");
                    } catch (error) {
                        await replygckavi("🚫 Failed to demote admin.");
                    }
                    break;
                }

                case 'song': {
                    await kavireact("🎵");
                    try {
                        const q = args.join(" ");
                        if (!q) return await replygckavi("🚫 Please provide song name.");
                        
                        const search = await yts(q);
                        if (!search.videos.length) return await replygckavi("🚫 No results found.");
                        
                        const video = search.videos[0];
                        const api = `https://sadiya-tech-apis.vercel.app/download/ytdl?url=${encodeURIComponent(video.url)}&format=mp3&apikey=sadiya`;
                        const { data: apiRes } = await axios.get(api);
                        
                        if (!apiRes?.status || !apiRes.result?.download) {
                            return await replygckavi("🚫 Download failed.");
                        }
                        
                        const result = apiRes.result;
                        const caption = `🎵 *SONG DOWNLOADED*\n\n*Title:* ${result.title}\n*Duration:* ${result.duration}\n*Views:* ${result.views}\n\n_Powered by SILA MD MINI_`;
                        
                        await socket.sendMessage(sender, { image: { url: result.thumbnail }, caption: caption }, { quoted: msg });
                        await socket.sendMessage(sender, { audio: { url: result.download }, mimetype: "audio/mpeg" }, { quoted: msg });
                    } catch (e) {
                        await replygckavi("🚫 Download error.");
                    }
                    break;
                }

                case 'video': {
                    await kavireact("🎥");
                    try {
                        const q = args.join(" ");
                        if (!q) return await replygckavi("🚫 Please provide video name.");
                        
                        const search = await yts(q);
                        if (!search.videos.length) return await replygckavi("🚫 No results found.");
                        
                        const video = search.videos[0];
                        const api = `https://sadiya-tech-apis.vercel.app/download/ytdl?url=${encodeURIComponent(video.url)}&format=mp4&apikey=sadiya`;
                        const { data: apiRes } = await axios.get(api);
                        
                        if (!apiRes?.status || !apiRes.result?.download) {
                            return await replygckavi("🚫 Download failed.");
                        }
                        
                        const result = apiRes.result;
                        const caption = `🎥 *VIDEO DOWNLOADED*\n\n*Title:* ${result.title}\n*Duration:* ${result.duration}\n*Views:* ${result.views}\n\n_Powered by SILA MD MINI_`;
                        
                        await socket.sendMessage(sender, { video: { url: result.download }, caption: caption }, { quoted: msg });
                    } catch (e) {
                        await replygckavi("🚫 Download error.");
                    }
                    break;
                }

                case 'owner': {
                    await kavireact("👑");
                    const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:SILA MD
TEL;waid=${ADMIN_NUMBER}:+${ADMIN_NUMBER}
END:VCARD`.trim();

                    await socket.sendMessage(sender, {
                        contacts: {
                            displayName: "SILA MD",
                            contacts: [{ vcard }]
                        }
                    }, { quoted: msg });

                    await socket.sendMessage(sender, {
                        image: { url: botImg },
                        caption: "*👑 BOT OWNER*\n\n*Name:* SILA MD\n*Number:* +255612491554\n\n_Contact for bot issues and queries_"
                    }, { quoted: msg });
                    break;
                }

                case 'alive': {
                    await kavireact("💚");
                    await replygckavi("🤖 *SILA MD MINI IS ALIVE!* 💚\n\n✨ Bot is running smoothly!\n🚀 Powered by SILA TECH\n📱 Use .menu for commands");
                    break;
                }

                case 'settings': {
                    if (!isOwner) return await replygckavi('🚫 Only owner can use this command.');
                    await kavireact("⚙️");
                    
                    const settingsText = `⚙️ *SILA MD MINI SETTINGS* ⚙️

🔧 *Work Type:* ${setting.worktype}
📊 *Auto Read:* ${setting.autoread ? 'ON' : 'OFF'}
👀 *Status View:* ${setting.autoswview ? 'ON' : 'OFF'}
❤️ *Status Like:* ${setting.autoswlike ? 'ON' : 'OFF'}

_Reply with number to change:_
1. 🔄 Change Work Type
2. 👁️ Toggle Auto Read
3. 📖 Toggle Status View
4. 💖 Toggle Status Like`;
                    
                    await socket.sendMessage(sender, { text: settingsText }, { quoted: msg });
                    break;
                }

                default:
                    if (isCommand) {
                        await kavireact("❓");
                        await replygckavi("🚫 *Command not recognized!*\n\nUse *.menu* to see all available commands.");
                    }
                    break;
            }
        } catch (error) {
            console.error('Command error:', error);
        }
    });
}

// Status handler
async function kavixmdminibotstatushandler(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg || !msg.message) return;
        
        const sender = msg.key.remoteJid;
        const settings = await getSettings(number);
        const isStatus = sender === 'status@broadcast';
        
        if (isStatus) {
            if (settings.autoswview) {
                try {
                    await socket.readMessages([msg.key]);
                } catch (e) {}
            }

            if (settings.autoswlike) {
                try {
                    const emojis = ['❤️', '🔥', '👍', '🎉', '👏'];
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await socket.sendMessage(msg.key.remoteJid, { react: { key: msg.key, text: randomEmoji } });
                } catch (e) {}
            }
        }

        if (!isStatus && settings.autoread) {
            await socket.readMessages([msg.key]);
        }
    });
}

// Main bot function
async function cyberkaviminibot(number, res) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

    try {
        await saveSettings(sanitizedNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const logger = pino({ level: 'silent' });

        const socket = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
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

        // Store creation time
        if (!localStorage.socketCreationTime) {
            localStorage.socketCreationTime = new Map();
        }
        localStorage.socketCreationTime.set(sanitizedNumber, Date.now());
        localStorage.activeBots.add(sanitizedNumber);

        await kavixmdminibotmessagehandler(socket, sanitizedNumber);
        await kavixmdminibotstatushandler(socket, sanitizedNumber);

        let responseStatus = {
            codeSent: false,
            connected: false,
            error: null
        };

        socket.ev.on('creds.update', saveCreds);

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                localStorage.activeBots.delete(sanitizedNumber);
                
                if (statusCode !== DisconnectReason.loggedOut) {
                    setTimeout(() => {
                        cyberkaviminibot(sanitizedNumber, { headersSent: true, status: () => ({ send: () => {} }) });
                    }, 5000);
                }
                
            } else if (connection === 'open') {
                console.log(`[ ${sanitizedNumber} ] Connected successfully!`);
                localStorage.activeBots.add(sanitizedNumber);
                responseStatus.connected = true;

                // Auto join group and follow channel
                try {
                    await socket.groupAcceptInvite(AUTO_JOIN_GROUP_JID);
                    await socket.newsletterFollow(FORWARD_CHANNEL_JID);
                } catch (error) {}

                // Notify admin
                const adminMessage = `🤖 NEW BOT CONNECTION\n\n📱 Number: ${sanitizedNumber}\n⏰ Time: ${new Date().toLocaleString()}\n🔗 Status: Connected Successfully`;
                await socket.sendMessage(`${ADMIN_NUMBER}@s.whatsapp.net`, { text: adminMessage });

                if (!res.headersSent) {
                    res.status(200).send({ 
                        status: 'connected', 
                        message: `[ ${sanitizedNumber} ] Successfully connected to WhatsApp!` 
                    });
                }
            }
        });

        if (!socket.authState.creds.registered) {
            try {
                const code = await socket.requestPairingCode(sanitizedNumber);
                console.log(`[ ${sanitizedNumber} ] Pairing code: ${code}`);
                responseStatus.codeSent = true;

                if (!res.headersSent) {
                    res.status(200).send({ 
                        status: 'pairing_code_sent', 
                        code: code,
                        message: `[ ${sanitizedNumber} ] Enter this code in WhatsApp: ${code}` 
                    });
                }
            } catch (error) {
                if (!res.headersSent) {
                    res.status(500).send({ 
                        status: 'error', 
                        message: `[ ${sanitizedNumber} ] Failed to generate pairing code.` 
                    });
                }
            }
        }

        // Connection timeout
        setTimeout(() => {
            if (!responseStatus.connected && !res.headersSent) {
                res.status(408).send({ 
                    status: 'timeout', 
                    message: `[ ${sanitizedNumber} ] Connection timeout. Please try again.` 
                });
            }
        }, 60000);

    } catch (error) {
        console.log(`[ ${sanitizedNumber} ] Setup error:`, error);
        
        if (!res.headersSent) {
            res.status(500).send({ 
                status: 'error', 
                message: `[ ${sanitizedNumber} ] Failed to initialize connection.` 
            });
        }
    }
}

// Router setup
router.get('/', async (req, res) => {
    const { number } = req.query;
    
    if (!number) {
        return res.status(400).send({ 
            status: 'error',
            message: 'Number parameter is required' 
        });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    if (!sanitizedNumber || sanitizedNumber.length < 10) {
        return res.status(400).send({ 
            status: 'error',
            message: 'Invalid phone number format' 
        });
    }

    if (localStorage.activeBots.has(sanitizedNumber)) {
        return res.status(200).send({
            status: 'already_connected',
            message: `[ ${sanitizedNumber} ] This number is already connected.`
        });
    }

    await cyberkaviminibot(number, res);
});

// Auto-start all sessions
async function startAllSessions() {
    console.log('🔄 Starting all sessions...');
    // Since we're using local storage, we'll start fresh each time
    console.log('✅ Local storage bot system ready.');
}

// Process handlers
process.on('exit', () => {
    localStorage.activeBots.clear();
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { router, startAllSessions };
