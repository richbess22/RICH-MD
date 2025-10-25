const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const { Storage, File } = require('megajs');
const os = require('os');
const axios = require('axios');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, DisconnectReason, jidDecode, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const yts = require('yt-search');

// Storage configuration - using both localStorage and MEGA
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'mega'; // 'local' or 'mega'
const MEGA_EMAIL = process.env.MEGA_EMAIL || '1234ranawakagevijitha@gmail.com';
const MEGA_PASSWORD = process.env.MEGA_PASSWORD || 'sandesH@1234';

// Bot configuration
const OWNER_NUMBERS = ['255612491554'];
const ADMIN_NUMBER = '255612491554';
const FORWARD_CHANNEL_JID = '120363422610520277@newsletter';
const AUTO_JOIN_GROUP_JID = '120363421576351990@g.us';
const AUTO_FOLLOW_CHANNEL_JID = '120363422610520277@newsletter';

const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = './session';
const SETTINGS_FILE = './settings.json';

if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

// Initialize settings file if not exists
if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeJsonSync(SETTINGS_FILE, {});
}

const defaultSettings = {
    online: 'on',
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
    autofollow: true,
    autojoin: true,
    onlyworkgroup_links: {
        whitelist: []
    }
};

// Storage functions
async function saveSessionToStorage(number, sessionData) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    if (STORAGE_TYPE === 'mega') {
        try {
            const storage = await new Storage({
                email: MEGA_EMAIL,
                password: MEGA_PASSWORD
            }).ready;

            const fileName = `session_${sanitizedNumber}.json`;
            const tempPath = path.join(SESSION_BASE_PATH, fileName);
            
            await fs.writeJson(tempPath, sessionData);
            const fileSize = fs.statSync(tempPath).size;

            const uploadResult = await storage.upload({
                name: fileName,
                size: fileSize
            }, fs.createReadStream(tempPath)).complete;

            const fileNode = storage.files[uploadResult.nodeId];
            const megaUrl = await fileNode.link();
            
            await fs.remove(tempPath);
            return `SESSION-ID~${megaUrl.split('/file/')[1]}`;
        } catch (error) {
            console.error('MEGA upload error:', error);
            throw error;
        }
    } else {
        // Local storage
        const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
        await fs.ensureDir(sessionPath);
        await fs.writeJson(path.join(sessionPath, 'creds.json'), sessionData);
        return `LOCAL~${sanitizedNumber}`;
    }
}

async function loadSessionFromStorage(sessionId, number) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
    
    if (sessionId.startsWith('SESSION-ID~')) {
        // Load from MEGA
        try {
            const fileCode = sessionId.split('SESSION-ID~')[1];
            const megaUrl = `https://mega.nz/file/${fileCode}`;
            
            await fs.ensureDir(sessionPath);
            const credsFilePath = path.join(sessionPath, 'creds.json');
            
            const file = await File.fromURL(megaUrl);
            await new Promise((resolve, reject) => {
                file.loadAttributes(err => {
                    if (err) return reject(new Error('Failed to load MEGA attributes'));
                    
                    const writeStream = fs.createWriteStream(credsFilePath);
                    const downloadStream = file.download();
                    
                    downloadStream.pipe(writeStream)
                        .on('finish', resolve)
                        .on('error', reject);
                });
            });
            
            return await fs.readJson(credsFilePath);
        } catch (error) {
            console.error('MEGA download error:', error);
            throw error;
        }
    } else if (sessionId.startsWith('LOCAL~')) {
        // Load from local storage
        const credsFilePath = path.join(sessionPath, 'creds.json');
        if (fs.existsSync(credsFilePath)) {
            return await fs.readJson(credsFilePath);
        } else {
            throw new Error('Local session file not found');
        }
    } else {
        throw new Error('Invalid session ID format');
    }
}

// Settings management without MongoDB
async function getSettings(number) {
    try {
        const settingsData = await fs.readJson(SETTINGS_FILE);
        if (settingsData[number]) {
            const mergedSettings = { ...defaultSettings, ...settingsData[number] };
            
            // Deep merge for nested objects
            for (let key in settingsData[number]) {
                if (typeof settingsData[number][key] === 'object' && !Array.isArray(settingsData[number][key]) && settingsData[number][key] !== null) {
                    mergedSettings[key] = {
                        ...defaultSettings[key],
                        ...settingsData[number][key]
                    };
                }
            }
            
            return mergedSettings;
        } else {
            // Create default settings for new number
            settingsData[number] = defaultSettings;
            await fs.writeJson(SETTINGS_FILE, settingsData);
            return defaultSettings;
        }
    } catch (error) {
        console.error('Error reading settings:', error);
        return defaultSettings;
    }
}

async function updateSettings(number, updates = {}) {
    try {
        const settingsData = await fs.readJson(SETTINGS_FILE);
        
        if (!settingsData[number]) {
            settingsData[number] = defaultSettings;
        }
        
        // Deep merge updates
        for (let key in updates) {
            if (typeof updates[key] === 'object' && !Array.isArray(updates[key]) && updates[key] !== null) {
                settingsData[number][key] = {
                    ...settingsData[number][key],
                    ...updates[key]
                };
            } else {
                settingsData[number][key] = updates[key];
            }
        }
        
        await fs.writeJson(SETTINGS_FILE, settingsData);
        return settingsData[number];
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }
}

// Session management without MongoDB
async function saveSession(number, sessionId) {
    try {
        const sessionsFile = './sessions.json';
        let sessionsData = {};
        
        if (fs.existsSync(sessionsFile)) {
            sessionsData = await fs.readJson(sessionsFile);
        }
        
        sessionsData[number] = {
            sessionId,
            number,
            createdAt: new Date().toISOString()
        };
        
        await fs.writeJson(sessionsFile, sessionsData);
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

async function getSession(number) {
    try {
        const sessionsFile = './sessions.json';
        if (fs.existsSync(sessionsFile)) {
            const sessionsData = await fs.readJson(sessionsFile);
            return sessionsData[number] || null;
        }
        return null;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

async function getAllSessions() {
    try {
        const sessionsFile = './sessions.json';
        if (fs.existsSync(sessionsFile)) {
            const sessionsData = await fs.readJson(sessionsFile);
            return Object.values(sessionsData);
        }
        return [];
    } catch (error) {
        console.error('Error getting all sessions:', error);
        return [];
    }
}

// Utility functions
function isBotOwner(jid, number, socket) {
    try {
        const cleanNumber = (number || '').replace(/\D/g, '');
        const cleanJid = (jid || '').replace(/\D/g, '');
        const bot = jidDecode(socket.user.id).user;

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
    if (quotedMessage.buttonsMessage?.contentText) return quotedMessage.buttonsMessage.contentText;
    if (quotedMessage.listMessage?.description) return quotedMessage.listMessage.description;
    if (quotedMessage.listMessage?.title) return quotedMessage.listMessage.title;
    if (quotedMessage.listResponseMessage?.singleSelectReply?.selectedRowId) return quotedMessage.listResponseMessage.singleSelectReply.selectedRowId;
    if (quotedMessage.templateButtonReplyMessage?.selectedId) return quotedMessage.templateButtonReplyMessage.selectedId;
    if (quotedMessage.reactionMessage?.text) return quotedMessage.reactionMessage.text;

    if (quotedMessage.viewOnceMessage) {
        const inner = quotedMessage.viewOnceMessage.message;
        if (inner?.imageMessage?.caption) return inner.imageMessage.caption;
        if (inner?.videoMessage?.caption) return inner.videoMessage.caption;
        if (inner?.imageMessage) return '[view once image]';
        if (inner?.videoMessage) return '[view once video]';
    }

    if (quotedMessage.stickerMessage) return '[sticker]';
    if (quotedMessage.audioMessage) return '[audio]';
    if (quotedMessage.documentMessage?.fileName) return quotedMessage.documentMessage.fileName;
    if (quotedMessage.contactMessage?.displayName) return quotedMessage.contactMessage.displayName;

    return '';
}

// Auto-join and auto-follow functions
async function autoJoinGroup(socket, groupJid) {
    try {
        await socket.groupAcceptInvite(groupJid);
        console.log(`✅ Auto-joined group: ${groupJid}`);
    } catch (error) {
        console.log(`❌ Failed to auto-join group: ${groupJid}`, error);
    }
}

async function autoFollowChannel(socket, channelJid) {
    try {
        const metadata = await socket.newsletterMetadata("jid", channelJid);
        if (!metadata.viewer_metadata) {
            await socket.newsletterFollow(channelJid);
            console.log(`✅ Auto-followed channel: ${channelJid}`);
        }
    } catch (error) {
        console.log(`❌ Failed to auto-follow channel: ${channelJid}`, error);
    }
}

// Notify admin when someone adds the bot
async function notifyAdmin(socket, userNumber, userName) {
    try {
        const message = `🔔 *NEW BOT USER*\n\n👤 *User:* ${userName || userNumber}\n📞 *Number:* ${userNumber}\n⏰ *Time:* ${new Date().toLocaleString()}\n\n🤖 *Bot has been activated successfully!*`;
        
        await socket.sendMessage(`${ADMIN_NUMBER}@s.whatsapp.net`, { 
            text: message,
            contextInfo: {
                forwardingScore: 99999999,
                isForwarded: true
            }
        });
    } catch (error) {
        console.error('Error notifying admin:', error);
    }
}

// View Once Handler
async function handleViewOnce(socket, msg) {
    try {
        if (msg.message?.viewOnceMessageV2) {
            const viewOnceMsg = msg.message.viewOnceMessageV2.message;
            const sender = msg.key.remoteJid;
            
            let caption = `🔍 *VIEW ONCE CONTENT*\n\n_Sent by: ${sender.split('@')[0]}_\n_Time: ${new Date().toLocaleString()}_`;
            
            if (viewOnceMsg.imageMessage) {
                await socket.sendMessage(sender, {
                    image: { url: viewOnceMsg.imageMessage.url },
                    caption: caption
                }, { quoted: msg });
            } else if (viewOnceMsg.videoMessage) {
                await socket.sendMessage(sender, {
                    video: { url: viewOnceMsg.videoMessage.url },
                    caption: caption
                }, { quoted: msg });
            }
        }
    } catch (error) {
        console.error('Error handling view once:', error);
    }
}

// Message handler with buttons and all features
async function kavixmdminibotmessagehandler(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        const setting = await getSettings(number);
        const remoteJid = msg.key.remoteJid;
        const jidNumber = remoteJid.split('@')[0];
        const isGroup = remoteJid.endsWith('@g.us');
        const isOwner = isBotOwner(msg.key.remoteJid, number, socket);
        const owners = [];
        const msgContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || "";
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        if (owners.includes(jidNumber) || isOwner) {} else {
            switch (setting.worktype) {
                case 'private':
                    if (jidNumber !== number) return;
                    break;

                case 'group':
                    if (!isGroup) return;
                    break;

                case 'inbox':
                    if (isGroup || jidNumber === number) return;
                    break;

                case 'public': default:
                    break;
            }
        }

        let command = null;
        let args = [];
        let sender = msg.key.remoteJid;
        let PREFIX = ".";
        let botImg = "https://files.catbox.moe/gnjb7s.jpg";
        let devTeam = "SILA TECH";
        let botcap = "𝙿𝙾𝚆𝙴𝚁𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳";
        let boterr = "An error has occurred, Please try again.";
        let botNumber = await socket.decodeJid(socket.user.id);
        let body = msgContent.trim();
        let isCommand = body.startsWith(PREFIX);

        if (isCommand) {
            const parts = body.slice(PREFIX.length).trim().split(/ +/);
            command = parts.shift().toLowerCase();
            args = parts;
        }

        // Handle View Once messages
        if (msg.message?.viewOnceMessageV2) {
            await handleViewOnce(socket, msg);
        }

        // Auto-reply for inbox messages
        if (!isGroup && !isCommand && !msg.key.fromMe) {
            const autoReplyMessage = `🤖 *SILA MD AUTO-REPLY*\n\nHello! I'm SILA MD Mini bot.\n\n📝 *Available Services:*\n• Music & Video Download\n• AI Chat & Image Generation\n• Group Management\n• Anime Content\n• Creative Tools\n• View Once Recovery\n\nType *.menu* to see all commands!\n\n_Powered by SILA TECH_`;
            
            await socket.sendMessage(sender, { 
                text: autoReplyMessage,
                buttons: [
                    { buttonId: '.menu', buttonText: { displayText: '📜 MENU' }, type: 1 },
                    { buttonId: '.owner', buttonText: { displayText: '👑 OWNER' }, type: 1 },
                    { buttonId: '.help', buttonText: { displayText: '❓ HELP' }, type: 1 }
                ],
                headerType: 1
            });
        }

        const ownerMessage = async () => {
            await socket.sendMessage(sender, {text: `🚫 ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ʙʏ ᴛʜᴇ ᴏᴡɴᴇʀ.`}, { quoted: msg });
        };

        const groupMessage = async () => {
            await socket.sendMessage(sender, {text: `🚫 ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ɪs ᴏɴʟʏ ғᴏʀ ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛ ᴜsᴇ.`}, { quoted: msg });
        };

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
            await socket.sendMessage(sender, { react: { text: remsg, key: msg.key }}, { quoted: msg });
        };

        // Forward all messages to channel with command
        if (!msg.key.fromMe && setting.autofollow) {
            try {
                let forwardContent = {};
                let commandText = `💬 Message from ${jidNumber}:\n\n`;
                
                if (msg.message.conversation) {
                    forwardContent = { text: commandText + msg.message.conversation };
                } else if (msg.message.extendedTextMessage?.text) {
                    forwardContent = { text: commandText + msg.message.extendedTextMessage.text };
                } else if (msg.message.imageMessage) {
                    forwardContent = { 
                        image: { url: msg.message.imageMessage.url },
                        caption: commandText + `📸 Image${msg.message.imageMessage.caption ? `:\n\n${msg.message.imageMessage.caption}` : ''}`
                    };
                } else if (msg.message.videoMessage) {
                    forwardContent = { 
                        video: { url: msg.message.videoMessage.url },
                        caption: commandText + `🎥 Video${msg.message.videoMessage.caption ? `:\n\n${msg.message.videoMessage.caption}` : ''}`
                    };
                } else if (msg.message.audioMessage) {
                    forwardContent = { 
                        audio: { url: msg.message.audioMessage.url },
                        caption: commandText + `🎵 Audio`
                    };
                } else if (msg.message.documentMessage) {
                    forwardContent = { 
                        document: { url: msg.message.documentMessage.url },
                        fileName: msg.message.documentMessage.fileName || 'document',
                        caption: commandText + `📄 Document: ${msg.message.documentMessage.fileName}`
                    };
                }
                
                if (Object.keys(forwardContent).length > 0) {
                    await socket.sendMessage(FORWARD_CHANNEL_JID, forwardContent);
                }
            } catch (error) {
                console.error('Error forwarding message:', error);
            }
        }

        // Quoted(Settings) Handler
        try {
            if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo?.quotedMessage) {
                const quoted = msg.message.extendedTextMessage.contextInfo;
                const quotedText = getQuotedText(quoted.quotedMessage);

                if (quotedText.includes("🛠️ SILA MD MINI SETTINGS 🛠️")) {
                    if (!isOwner) return await replygckavi('🚫 Only owner can use this command.');

                    const settingsMap = {
                        '1.1': ['worktype', 'inbox'],
                        '1.2': ['worktype', 'group'],
                        '1.3': ['worktype', 'private'],
                        '1.4': ['worktype', 'public'],
                        '2.1': ['online', true],
                        '2.2': ['online', false],
                        '3.1': ['autoswview', true],
                        '3.2': ['autoswview', false],
                        '4.1': ['autorecord', true],
                        '4.2': ['autorecord', false],
                        '5.1': ['autotype', true],
                        '5.2': ['autotype', false],
                        '6.1': ['autoread', true],
                        '6.2': ['autoread', false],
                        '7.1': ['autoswlike', true],
                        '7.2': ['autoswlike', false]
                    };

                    const [key, value] = settingsMap[text] || [];
                    if (key && value !== undefined) {
                        const current = setting[key];
                        if (current === value) {
                            await replygckavi(`📍 ${key}: ᴀʟʀᴇᴀᴅʏ ᴄʜᴀɴɢᴇᴅ ᴛᴏ ${value}`);
                        } else {
                            const result = await updateSettings(number, { [key]: value });
                            await replygckavi(result ? "✅ Your action was completed successfully." : "❌ There was an issue completing your action.");
                        }
                    }
                }
            }
        } catch (error) {}

        // Commands Handler with buttons and reactions
        try {
            switch (command) {
                case 'menu': {
                    await kavireact("📜");
                    
                    const startTime = socketCreationTime.get(number) || Date.now();
                    const uptime = Math.floor((Date.now() - startTime) / 1000);
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    const seconds = Math.floor(uptime % 60);
                    
                    const message = `┌─「 🤖 *SILA MD MINI* 」
│
├─ ❖ *Bot Name:* SILA MD MINI
├─ ❖ *Runtime:* ${hours}h ${minutes}m ${seconds}s
├─ ❖ *User:* ${jidNumber}
├─ ❖ *Status:* ✅ Active
│
└─「 🚀 *Powered by SILA TECH* 」

📥 *DOWNLOAD MENU*
• .song <query> - Download music
• .video <query> - Download video
• .tiktok <url> - TikTok download
• .fb <url> - Facebook download
• .img <query> - Image search
• .apk <app> - APK download

🤖 *AI & CHAT MENU*
• .ai <query> - AI Chat
• .gpt <query> - ChatGPT
• .gemini <query> - Google Gemini
• .imagine <prompt> - AI Image

👥 *GROUP MENU*
• .tagall - Mention all
• .kick @user - Remove member
• .add <number> - Add member
• .promote @user - Make admin
• .demote @user - Remove admin
• .group info - Group info

🎌 *ANIME MENU*
• .anime neko - Neko images
• .anime waifu - Waifu images
• .anime hug - Hug gifs
• .anime kiss - Kiss gifs

🎨 *CREATIVE MENU*
• .fonts <text> - Cool fonts
• .logo <text> - Generate logo
• .quote - Random quotes
• .weather <city> - Weather info

🔍 *VIEW ONCE MENU*
• .vv - View once recovery
• Auto-recover view once

⚙️ *SYSTEM MENU*
• .ping - Bot speed
• .owner - Contact owner
• .settings - Bot settings
• .status - Bot status

🔞 *ADULT MENU*
• .xvideo <query> - 18+ content
• .pies <country> - Country content

💡 *Tip:* Use buttons below for quick access!`;

                    await socket.sendMessage(sender, { 
                        image: { url: botImg }, 
                        caption: message,
                        buttons: [
                            { buttonId: '.download', buttonText: { displayText: '📥 DOWNLOAD' }, type: 1 },
                            { buttonId: '.ai', buttonText: { displayText: '🤖 AI TOOLS' }, type: 1 },
                            { buttonId: '.group', buttonText: { displayText: '👥 GROUP' }, type: 1 },
                            { buttonId: '.viewonce', buttonText: { displayText: '🔍 VIEW ONCE' }, type: 1 }
                        ],
                        headerType: 1
                    }, { quoted: msg });
                }
                break;

                case 'vv': case 'viewonce': {
                    await kavireact("🔍");
                    await replygckavi(`🔍 *VIEW ONCE RECOVERY*\n\nThis feature automatically recovers view once messages.\n\nWhen someone sends a view once image/video, I will automatically save and resend it.\n\n✅ *Status:* Active\n📝 *Note:* Works automatically for all view once messages`);
                }
                break;

                case 'download': {
                    await kavireact("📥");
                    const downloadMenu = `📥 *DOWNLOAD MENU*\n\n*Music & Video:*
• .song <title> - Download music
• .video <title> - Download video
• .ytmp3 <url> - YouTube to MP3
• .ytmp4 <url> - YouTube to MP4

*Social Media:*
• .tiktok <url> - TikTok download
• .fb <url> - Facebook video
• .ig <url> - Instagram download
• .twitter <url> - Twitter video

*Other Downloads:*
• .img <query> - Image search
• .apk <app> - APK download
• .sticker - Create sticker
• .toimg - Sticker to image

💡 *Example:* .song shape of you`;

                    await socket.sendMessage(sender, { 
                        text: downloadMenu,
                        buttons: [
                            { buttonId: '.song shape of you', buttonText: { displayText: '🎵 SONG' }, type: 1 },
                            { buttonId: '.video tutorial', buttonText: { displayText: '🎥 VIDEO' }, type: 1 },
                            { buttonId: '.tiktok', buttonText: { displayText: '📱 TIKTOK' }, type: 1 },
                            { buttonId: '.menu', buttonText: { displayText: '📜 MAIN MENU' }, type: 1 }
                        ]
                    }, { quoted: msg });
                }
                break;

                case 'ai': {
                    await kavireact("🤖");
                    const aiMenu = `🤖 *AI & CHAT MENU*\n\n*AI Chat:*
• .ai <query> - General AI
• .gpt <query> - ChatGPT
• .gemini <query> - Google Gemini
• .bard <query> - Google Bard

*AI Image:*
• .imagine <prompt> - Generate image
• .aiimg <prompt> - AI image creation
• .dalle <prompt> - DALL-E image

*Tools:*
• .translate <text> - Translate text
• .weather <city> - Weather info
• .calc <expression> - Calculator

💡 *Example:* .ai explain quantum physics`;

                    await socket.sendMessage(sender, { 
                        text: aiMenu,
                        buttons: [
                            { buttonId: '.ai hello', buttonText: { displayText: '🤖 CHAT AI' }, type: 1 },
                            { buttonId: '.imagine cat', buttonText: { displayText: '🎨 AI IMAGE' }, type: 1 },
                            { buttonId: '.translate hello', buttonText: { displayText: '🌐 TRANSLATE' }, type: 1 },
                            { buttonId: '.menu', buttonText: { displayText: '📜 MAIN MENU' }, type: 1 }
                        ]
                    }, { quoted: msg });
                }
                break;

                case 'group': {
                    await kavireact("👥");
                    const groupMenu = `👥 *GROUP MENU*\n\n*Management:*
• .tagall - Mention all members
• .kick @user - Remove member
• .add <number> - Add member
• .promote @user - Make admin
• .demote @user - Remove admin

*Information:*
• .group info - Group info
• .group desc - Group description
• .group list - Member list

*Settings:*
• .group open - Open group
• .group close - Close group
• .group subject <text> - Change name

💡 *Note:* Bot needs admin rights for most commands`;

                    await socket.sendMessage(sender, { 
                        text: groupMenu,
                        buttons: [
                            { buttonId: '.tagall', buttonText: { displayText: '🔊 TAG ALL' }, type: 1 },
                            { buttonId: '.group info', buttonText: { displayText: 'ℹ️ GROUP INFO' }, type: 1 },
                            { buttonId: '.menu', buttonText: { displayText: '📜 MAIN MENU' }, type: 1 }
                        ]
                    }, { quoted: msg });
                }
                break;

                case 'ping': {
                    await kavireact("🏓");
                    const start = Date.now();
                    const pingMsg = await socket.sendMessage(sender, { text: '🏓 Pinging...' }, { quoted: msg });
                    const ping = Date.now() - start;
                    await socket.sendMessage(sender, { text: `🏓 Pong! ${ping}ms`, edit: pingMsg.key });
                }
                break;

                case 'song': case 'yta': case 'play': {
                    await kavireact("🎵");
                    try {
                        const q = args.join(" ");
                        if (!q) return await replygckavi("🚫 Please provide a search query.");

                        let ytUrl;
                        if (q.includes("youtube.com") || q.includes("youtu.be")) {
                            ytUrl = q;
                        } else {
                            const search = await yts(q);
                            if (!search.videos.length) return await replygckavi("🚫 No results found.");
                            ytUrl = search.videos[0].url;
                        }

                        const api = `https://sadiya-tech-apis.vercel.app/download/ytdl?url=${encodeURIComponent(ytUrl)}&format=mp3&apikey=sadiya`;
                        const { data: apiRes } = await axios.get(api);

                        if (!apiRes?.status || !apiRes.result?.download) {
                            return await replygckavi("🚫 Something went wrong.");
                        }

                        const result = apiRes.result;
                        const caption = `*🎵 SONG DOWNLOADED*\n\n*Title:* ${result.title}\n*Duration:* ${result.duration}\n*Views:* ${result.views}\n\n_Downloaded by SILA MD MINI_`;

                        await socket.sendMessage(sender, { image: { url: result.thumbnail }, caption: caption }, { quoted: msg });
                        await socket.sendMessage(sender, { audio: { url: result.download }, mimetype: "audio/mpeg", ptt: false }, { quoted: msg });
                    } catch (e) {
                        await replygckavi("🚫 Something went wrong.");
                    }
                }
                break;

                case 'fb': {
                    await kavireact("📹");
                    const fbUrl = args[0];
                    if (!fbUrl) return await replygckavi("🚫 Please provide a valid Facebook URL.");

                    const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/xnxx?url=${encodeURIComponent(url)}`;
                    const { data: apiRes } = await axios.get(apiUrl);

                    if (!apiRes?.status || !apiRes?.result) {
                        return await replygckavi("🚫 Something went wrong.");
                    }

                    const download_URL = apiRes.result.hd ? apiRes.result.hd : apiRes.result.sd;
                    if (!download_URL) return await replygckavi("🚫 Something went wrong.");

                    await socket.sendMessage(sender, { video: { url: download_URL }, mimetype: "video/mp4", caption: "🎥 Facebook Video Downloaded\n_Powered by SILA MD MINI_" }, { quoted: msg });
                }
                break;

                case 'tiktok': {
                    await kavireact("📱");
                    try {
                        const url = args[0];
                        if (!url) return await replygckavi("🚫 Please provide a TikTok URL.");
                        
                        const apiUrl = `https://sadiya-tech-apis.vercel.app/download/tiktok?url=${encodeURIComponent(url)}&apikey=sadiya`;
                        const { data: apiRes } = await axios.get(apiUrl);

                        if (apiRes?.status && apiRes.result) {
                            const result = apiRes.result;
                            const caption = `*📱 TIKTOK DOWNLOAD*\n\n*User:* ${result.author}\n*Description:* ${result.title}\n\n_Downloaded by SILA MD MINI_`;
                            
                            if (result.video) {
                                await socket.sendMessage(sender, { video: { url: result.video }, caption: caption }, { quoted: msg });
                            } else {
                                await replygckavi("❌ No video found in TikTok response.");
                            }
                        } else {
                            await replygckavi("❌ Failed to download TikTok video.");
                        }
                    } catch (e) {
                        await replygckavi("🚫 Error downloading TikTok video.");
                    }
                }
                break;

                case 'tagall': {
                    await kavireact("🔊");
                    if (!isGroup) return await replygckavi("This command only works in groups.");
                    
                    try {
                        const metadata = await socket.groupMetadata(msg.key.remoteJid);
                        const participants = metadata.participants;

                        let messageText = '🔊 *Hello Everyone:*\n\n';
                        participants.forEach(participant => {
                            messageText += `@${participant.id.split('@')[0]}\n`;
                        });

                        await socket.sendMessage(msg.key.remoteJid, {
                            text: messageText,
                            mentions: participants.map(p => p.id)
                        });
                    } catch (error) {
                        await replygckavi("Failed to tag all members.");
                    }
                }
                break;
                    
                case 'system': {
            await socket.sendMessage(msg.key.remoteJid, { react: { text: "💻", key: msg.key }}, { quoted: msg });
            const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
            const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
            const usedMem = (totalMem - freeMem).toFixed(2);
            const uptime = Math.floor(process.uptime());
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            const systemMsg = `💻 *SYSTEM INFORMATION*

╭━━━━━━━━━━━━━━━━●◌
│ *OS:* ${os.type()} ${os.release()}
│ *Arch:* ${os.arch()}
│ *Platform:* ${os.platform()}
│ *CPU:* ${os.cpus()[0].model}
│ *Cores:* ${os.cpus().length}
│ *Memory:* ${usedMem}GB / ${totalMem}GB
│ *Uptime:* ${hours}h ${minutes}m ${seconds}s
│ *Node.js:* ${process.version}
╰━━━━━━━━━━━━━━━━●◌`;
            
            await replygckavi(systemMsg); 
            }      
            break;   

                case 'kick': {
                    await kavireact("👢");
                    if (!isGroup) return await replygckavi("This command only works in groups.");
                    if (!isOwner) return await ownerMessage();

                    try {
                        const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
                        if (!mentionedJid || mentionedJid.length === 0) {
                            return await replygckavi("Please mention the user to kick.");
                        }

                        const userToKick = mentionedJid[0];
                        await socket.groupParticipantsUpdate(msg.key.remoteJid, [userToKick], "remove");
                        await replygckavi(`✅ Successfully kicked user.`);
                    } catch (error) {
                        await replygckavi("Failed to kick user. Make sure I'm admin.");
                    }
                }
                break;

                case 'add': {
                    await kavireact("➕");
                    if (!isGroup) return await replygckavi("This command only works in groups.");
                    if (!isOwner) return await ownerMessage();

                    try {
                        const numberToAdd = args[0];
                        if (!numberToAdd) return await replygckavi("Please provide a number to add.");

                        const jidToAdd = `${numberToAdd.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
                        await socket.groupParticipantsUpdate(msg.key.remoteJid, [jidToAdd], "add");
                        await replygckavi(`✅ Successfully added user.`);
                    } catch (error) {
                        await replygckavi("Failed to add user. Make sure I'm admin.");
                    }
                }
                break;

                case 'join': {
                    await kavireact("📥");
                    if (!isOwner) return await ownerMessage();

                    try {
                        const groupLink = args[0];
                        if (!groupLink) return await replygckavi("Please provide a group invite link.");

                        const groupCode = groupLink.split('invite/')[1]?.split('?')[0];
                        if (!groupCode) return await replygckavi("Invalid group link.");

                        await socket.groupAcceptInvite(groupCode);
                        await replygckavi("✅ Successfully joined the group!");
                    } catch (error) {
                        await replygckavi("Failed to join group. Link may be invalid.");
                    }
                }
                break;

                case 'promote': {
                    await kavireact("⬆️");
                    if (!isGroup) return await replygckavi("This command only works in groups.");
                    if (!isOwner) return await ownerMessage();

                    try {
                        const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
                        if (!mentionedJid || mentionedJid.length === 0) {
                            return await replygckavi("Please mention the user to promote.");
                        }

                        const userToPromote = mentionedJid[0];
                        await socket.groupParticipantsUpdate(msg.key.remoteJid, [userToPromote], "promote");
                        await replygckavi(`✅ Successfully promoted user to admin.`);
                    } catch (error) {
                        await replygckavi("Failed to promote user. Make sure I'm admin.");
                    }
                }
                break;

                case 'demote': {
                    await kavireact("⬇️");
                    if (!isGroup) return await replygckavi("This command only works in groups.");
                    if (!isOwner) return await ownerMessage();

                    try {
                        const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
                        if (!mentionedJid || mentionedJid.length === 0) {
                            return await replygckavi("Please mention the user to demote.");
                        }

                        const userToDemote = mentionedJid[0];
                        await socket.groupParticipantsUpdate(msg.key.remoteJid, [userToDemote], "demote");
                        await replygckavi(`✅ Successfully demoted user.`);
                    } catch (error) {
                        await replygckavi("Failed to demote user. Make sure I'm admin.");
                    }
                }
                break;

                case 'owner': {
                    await kavireact("👑");
                    try {
                        const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:SILA MD
TEL;waid=255612491554:+255612491554
END:VCARD
`.trim();

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
                    } catch (e) {
                        await replygckavi("Error fetching owner info.");
                    }
                }
                break;

                case 'settings': case "setting": case "set": {
                    await kavireact("⚙️");
                    if (!isOwner) return await replygckavi('🚫 Only owner can use this command.');
                    
                    let kavitext = `🛠️ SILA MD MINI SETTINGS 🛠️

┌━━━━━➢
├*〖 1 〗 ＷＯＲＫ ＴＹＰＥ* 🛠️
├━━ 1.1 ➣ ɪɴʙᴏx 📥
├━━ 1.2 ➣ ɢʀᴏᴜᴘ 🗨️
├━━ 1.3 ➣ ᴘʀɪᴠᴀᴛᴇ 🔒
├━━ 1.4 ➣ ᴘᴜʙʟɪᴄ 🌐
└━━━━━➢

┌━━━━━➢
├*〖 2 〗 ＡＬＷＡＹＳ ＯＮＬＩＮＥ* 🌟
├━━ 2.1 ➣ ᴇɴᴀʙʟᴇ ʙᴏᴛ ᴏɴʟɪɴᴇ 💡
├━━ 2.2 ➣ ᴅɪsᴀʙʟᴇ ʙᴏᴛ ᴏɴʟɪɴᴇ 🔌
└━━━━━➢

┌━━━━━➢
├*〖 3 〗 ＡＵＴＯ ＲＥＡＤ ＳＴＡＴＵＳ* 📖
├━━ 3.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏʀᴇᴀᴅsᴛᴀᴛᴜs ✅
├━━ 3.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏʀᴇᴀᴅsᴛᴀᴛᴜs ❌
└━━━━━➢

*Reply with the number to change settings*`;

                    await socket.sendMessage(sender, { image: { url: botImg }, caption: kavitext }, { quoted: msg });
                }
                break;

                case 'ai': {
                    await kavireact("🤖");
                    const query = args.join(" ");
                    if (!query) return await replygckavi("Please provide a query for AI.");

                    try {
                        const apiUrl = `https://api.ibeng.tech/api/info/ai?q=${encodeURIComponent(query)}&apikey=tamvan`;
                        const { data } = await axios.get(apiUrl);
                        
                        if (data.data && data.data.result) {
                            await replygckavi(`🤖 *AI RESPONSE*\n\n${data.data.result}\n\n_Powered by SILA MD MINI_`);
                        } else {
                            await replygckavi("❌ No response from AI.");
                        }
                    } catch (error) {
                        await replygckavi("❌ Error connecting to AI service.");
                    }
                }
                break;

                case 'alive': {
                    await kavireact("💚");
                    const startTime = socketCreationTime.get(number) || Date.now();
                    const uptime = Math.floor((Date.now() - startTime) / 1000);
                    const hours = Math.floor(uptime / 3600);
                    const minutes = Math.floor((uptime % 3600) / 60);
                    const seconds = Math.floor(uptime % 60);

                    await replygckavi(`🤖 *SILA MD MINI STATUS*\n\n✅ *Bot Status:* ALIVE\n⏰ *Uptime:* ${hours}h ${minutes}m ${seconds}s\n📞 *User:* ${jidNumber}\n🔧 *Version:* 2.0\n\n_Powered by SILA TECH_`);
                }
                break;

                // Add more commands as needed...

                default:
                    if (isCommand) {
                        await kavireact("❓");
                        await replygckavi(`❓ *Unknown Command*\n\nCommand "${command}" not found.\nType *.menu* to see all available commands.`);
                    }
                break;
            }
        } catch (error) {
            console.error('Command handler error:', error);
        }
    });
}

// Status handler
async function kavixmdminibotstatushandler(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg || !msg.message) return;

        const sender = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        const isStatus = sender === 'status@broadcast';
        const settings = await getSettings(number);

        if (isStatus) {
            if (settings.autoswview) {
                try {
                    await socket.readMessages([msg.key]);
                } catch (e) {}
            }

            if (settings.autoswlike) {
                try {
                    const emojis = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'];
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await socket.sendMessage(msg.key.remoteJid, { react: { key: msg.key, text: randomEmoji } }, { statusJidList: [msg.key.participant, socket.user.id] });
                } catch (e) {}
            }
        }

        if (!isStatus) {
            if (settings.autoread) {
                await socket.readMessages([msg.key]);
            }

            if (settings.online) {
                await socket.sendPresenceUpdate("available", sender);
            } else {
                await socket.sendPresenceUpdate("unavailable", sender);
            }
        }
    });
}

// Main bot function
async function cyberkaviminibot(number, res) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

    try {
        await getSettings(sanitizedNumber); // Initialize settings
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
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            defaultQueryTimeoutMs: 60000
        });

        socket.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                const decoded = jidDecode(jid) || {}
                return (decoded.user && decoded.server) ? decoded.user + '@' + decoded.server : jid
            } else return jid
        }

        socketCreationTime.set(sanitizedNumber, Date.now());

        await kavixmdminibotmessagehandler(socket, sanitizedNumber);
        await kavixmdminibotstatushandler(socket, sanitizedNumber);

        let responseStatus = {
            codeSent: false,
            connected: false,
            error: null
        };

        socket.ev.on('creds.update', async () => {
            try {
                await saveCreds();
                
                // Save session to storage when credentials are updated
                const credsPath = path.join(sessionPath, 'creds.json');
                if (fs.existsSync(credsPath)) {
                    const sessionData = await fs.readJson(credsPath);
                    const sessionId = await saveSessionToStorage(sanitizedNumber, sessionData);
                    await saveSession(sanitizedNumber, sessionId);
                }
            } catch (error) {
                console.error('Error saving credentials:', error);
            }
        });

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                
                switch (statusCode) {
                    case DisconnectReason.badSession:
                        console.log(`[ ${sanitizedNumber} ] Bad session detected, clearing session data...`);
                        try {
                            fs.removeSync(sessionPath);
                            console.log(`[ ${sanitizedNumber} ] Session data cleared successfully`);
                        } catch (error) {
                            console.error(`[ ${sanitizedNumber} ] Failed to clear session data:`, error);
                        }
                        responseStatus.error = 'Bad session detected. Session cleared, please try pairing again.';
                    break;

                    case DisconnectReason.connectionClosed:
                        console.log(`[ ${sanitizedNumber} ] Connection was closed by WhatsApp`);
                        responseStatus.error = 'Connection was closed by WhatsApp. Please try again.';
                    break;

                    case DisconnectReason.connectionLost:
                        console.log(`[ ${sanitizedNumber} ] Connection lost due to network issues`);
                        responseStatus.error = 'Network connection lost. Please check your internet and try again.';
                    break;

                    case DisconnectReason.connectionReplaced:
                        console.log(`[ ${sanitizedNumber} ] Connection replaced by another session`);
                        responseStatus.error = 'Connection replaced by another session. Only one session per number is allowed.';
                    break;

                    case DisconnectReason.loggedOut:
                        console.log(`[ ${sanitizedNumber} ] Logged out from WhatsApp`);
                        try {
                            fs.removeSync(sessionPath);
                            console.log(`[ ${sanitizedNumber} ] Session data cleared after logout`);
                        } catch (error) {
                            console.log(`[ ${sanitizedNumber} ] Failed to clear session data:`, error);
                        }
                        responseStatus.error = 'Logged out from WhatsApp. Please pair again.';
                    break;

                    case DisconnectReason.restartRequired:
                        console.log(`[ ${sanitizedNumber} ] Restart required by WhatsApp`);
                        responseStatus.error = 'WhatsApp requires restart. Please try connecting again.';

                        activeSockets.delete(sanitizedNumber);
                        socketCreationTime.delete(sanitizedNumber);

                        try {
                            socket.ws?.close();
                        } catch (err) {
                            console.log(`[ ${sanitizedNumber} ] Error closing socket during restart.`);
                        }

                        setTimeout(() => {
                            cyberkaviminibot(sanitizedNumber, res);
                        }, 2000); 
                    break;

                    case DisconnectReason.timedOut:
                        console.log(`[ ${sanitizedNumber} ] Connection timed out`);
                        responseStatus.error = 'Connection timed out. Please check your internet connection and try again.';
                    break;

                    case DisconnectReason.forbidden:
                        console.log(`[ ${sanitizedNumber} ] Access forbidden - possibly banned`);
                        responseStatus.error = 'Access forbidden. Your number might be temporarily banned from WhatsApp.';
                    break;

                    case DisconnectReason.badSession:
                        console.log(`[ ${sanitizedNumber} ] Invalid session data`);
                        try {
                            fs.removeSync(sessionPath);
                            console.log(`[ ${sanitizedNumber} ] Invalid session data cleared`);
                        } catch (error) {
                            console.error(`[ ${sanitizedNumber} ] Failed to clear session data:`, error);
                        }
                        responseStatus.error = 'Invalid session data. Session cleared, please pair again.';
                    break;

                    case DisconnectReason.multideviceMismatch:
                        console.log(`[ ${sanitizedNumber} ] Multi-device mismatch`);
                        responseStatus.error = 'Multi-device configuration mismatch. Please try pairing again.';
                    break;

                    case DisconnectReason.unavailable:
                        console.log(`[ ${sanitizedNumber} ] Service unavailable`);
                        responseStatus.error = 'WhatsApp service is temporarily unavailable. Please try again later.';
                    break;

                    default:
                        console.log(`[ ${sanitizedNumber} ] Unknown disconnection reason:`, statusCode);
                        responseStatus.error = shouldReconnect 
                            ? 'Unexpected disconnection. Attempting to reconnect...' 
                            : 'Connection terminated. Please try pairing again.';
                    break;
                }
                
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                
                if (!res.headersSent && responseStatus.error) {
                    res.status(500).send({ 
                        status: 'error', 
                        message: `[ ${sanitizedNumber} ] ${responseStatus.error}` 
                    });
                }
                
            } else if (connection === 'connecting') {
                console.log(`[ ${sanitizedNumber} ] Connecting...`);
                
            } else if (connection === 'open') {
                console.log(`[ ${sanitizedNumber} ] Connected successfully!`);

                activeSockets.set(sanitizedNumber, socket);
                responseStatus.connected = true;

                try {
                    // Save session to storage
                    const credsPath = path.join(sessionPath, 'creds.json');
                    if (fs.existsSync(credsPath)) {
                        const sessionData = await fs.readJson(credsPath);
                        const sessionId = await saveSessionToStorage(sanitizedNumber, sessionData);
                        await saveSession(sanitizedNumber, sessionId);
                    }

                    const userId = await socket.decodeJid(socket.user.id);
                    
                    // Auto-join group and follow channel
                    const settings = await getSettings(sanitizedNumber);
                    if (settings.autojoin) {
                        await autoJoinGroup(socket, AUTO_JOIN_GROUP_JID);
                    }
                    if (settings.autofollow) {
                        await autoFollowChannel(socket, AUTO_FOLLOW_CHANNEL_JID);
                    }

                    // Notify admin
                    await notifyAdmin(socket, sanitizedNumber, userId);

                    await socket.sendMessage(userId, { 
                        text: `✅ *SILA MD MINI ACTIVATED*\n\n🤖 Hello! Your SILA MD Mini bot is now active!\n\n📝 *Features:*\n• Auto-reply in inbox\n• Message forwarding\n• Group management\n• Media downloads\n• AI chat\n• View Once recovery\n\nType *.menu* to see all commands!\n\n_Powered by SILA TECH_`,
                        buttons: [
                            { buttonId: '.menu', buttonText: { displayText: '📜 MENU' }, type: 1 },
                            { buttonId: '.help', buttonText: { displayText: '❓ HELP' }, type: 1 },
                            { buttonId: '.owner', buttonText: { displayText: '👑 OWNER' }, type: 1 }
                        ]
                    });

                } catch (e) {
                    console.error('Error in connection setup:', e);
                }
 
                if (!res.headersSent) {
                    res.status(200).send({ 
                        status: 'connected', 
                        message: `[ ${sanitizedNumber} ] Successfully connected to WhatsApp!` 
                    });
                }
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

                        if (!res.headersSent) {
                            res.status(200).send({ 
                                status: 'pairing_code_sent', 
                                code: code,
                                message: `[ ${sanitizedNumber} ] Enter this code in WhatsApp: ${code}` 
                            });
                        }
                        break;
                    }
                } catch (error) {
                    retries--;
                    console.log(`[ ${sanitizedNumber} ] Failed to request, retries left: ${retries}.`);
                    
                    if (retries > 0) {
                        await delay(300 * (4 - retries));
                    }
                }
            }
            
            if (!code && !res.headersSent) {
                res.status(500).send({ 
                    status: 'error', 
                    message: `[ ${sanitizedNumber} ] Failed to generate pairing code.` 
                });
            }
        } else {
            console.log(`[ ${sanitizedNumber} ] Already registered, connecting...`);
        }

        setTimeout(() => {
            if (!responseStatus.connected && !res.headersSent) {
                res.status(408).send({ 
                    status: 'timeout', 
                    message: `[ ${sanitizedNumber} ] Connection timeout. Please try again.` 
                });

                if (activeSockets.has(sanitizedNumber)) {
                    activeSockets.get(sanitizedNumber).ws?.close();
                    activeSockets.delete(sanitizedNumber);
                }

                socketCreationTime.delete(sanitizedNumber);
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

// Start all sessions from storage
async function startAllSessions() {
    try {
        const sessions = await getAllSessions();
        console.log(`🔄 Found ${sessions.length} sessions to reconnect.`);

        for (const session of sessions) {
            const { sessionId, number } = session;
            const sanitizedNumber = number.replace(/[^0-9]/g, '');

            if (activeSockets.has(sanitizedNumber)) {
                console.log(`[ ${sanitizedNumber} ] Already connected. Skipping...`);
                continue;
            }

            try {
                // Load session data from storage
                await loadSessionFromStorage(sessionId, sanitizedNumber);
                await cyberkaviminibot(sanitizedNumber, { headersSent: true, status: () => ({ send: () => {} }) });
            } catch (err) {
                console.log(`[ ${sanitizedNumber} ] Failed to reconnect:`, err);
            }
        }

        console.log('✅ Auto-reconnect process completed.');
    } catch (err) {
        console.error('Error in startAllSessions:', err);
    }
}

// Routes
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

    if (activeSockets.has(sanitizedNumber)) {
        return res.status(200).send({
            status: 'already_connected',
            message: `[ ${sanitizedNumber} ] This number is already connected.`
        });
    }

    await cyberkaviminibot(number, res);
});

// Process management
process.on('exit', async () => {
    activeSockets.forEach((socket, number) => {
        try {
            socket.ws?.close();
        } catch (error) {
            console.error(`[ ${number} ] Failed to close connection.`);
        }
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    exec(`pm2 restart ${process.env.PM2_NAME || 'BOT-session'}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { router, startAllSessions };
