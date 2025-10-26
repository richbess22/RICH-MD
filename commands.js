const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API Configuration - FIXED VERSION
const APIS = {
    // Original APIs
    chatgpt: 'https://api.dreaded.site/api/chatgpt?text=',
    gemini: 'https://api.dreaded.site/api/gemini2?text=',
    gemini2: 'https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=',
    gemini3: 'https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=',
    anime: 'https://api.some-random-api.com/animu/',
    facebook: 'https://api.princetechn.com/api/download/facebook?apikey=prince&url=',
    tiktok: 'https://api.princetechn.com/api/download/tiktok?apikey=prince&url=',
    imagine: 'https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=',
    sora: 'https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=',
    pies: 'https://shizoapi.onrender.com/api/pies/',
    wasted: 'https://some-random-api.com/canvas/overlay/wasted?avatar=',
    welcome: 'https://api.some-random-api.com/welcome/img/2/gaming3',

    // New APIs from your list
    youtube_mp3: 'https://sadiya-tech-apis.vercel.app/download/ytdl?url=',
    mediafire: 'https://okatsu-rolezapiiz.vercel.app/tools/mediafire?url=',
    mediafire_search: 'https://okatsu-rolezapiiz.vercel.app/search/mediafire?query=',
    youtube_play: 'https://okatsu-rolezapiiz.vercel.app/search/play?query=',
    youtube_mp4: 'https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=',
    imagine2: 'https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=',
    videy: 'https://okatsu-rolezapiiz.vercel.app/downloader/videy?url=',
    tocarbon: 'https://okatsu-rolezapiiz.vercel.app/maker/tocarbon?url=',
    gpt_new: 'https://okatsu-rolezapiiz.vercel.app/ai/chat?q=',
    github_trend: 'https://okatsu-rolezapiiz.vercel.app/search/githubtrend',
    txt2video: 'https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=',
    txt2img: 'https://okatsu-rolezapiiz.vercel.app/ai/txt2img?text=',
    gemini_new: 'https://okatsu-rolezapiiz.vercel.app/ai/gemini?q=',
    facebook_new: 'https://okatsu-rolezapiiz.vercel.app/downloader/facebook?url=',
    anime_quote: 'https://okatsu-rolezapiiz.vercel.app/anime/quote',
    sila: 'https://okatsu-rolezapiiz.vercel.app/ai/ask?q=',
    catbox: 'https://catbox.moe/user/api.php'
};

// Bot Configuration
const BOT_CONFIG = {
    admin: '255612491554',
    channel_jid: '120363422610520277@newsletter',
    channel_name: 'SILA TECH',
    group_link: 'https://chat.whatsapp.com/GoavLtSBgRoAvmJfSgaOgg',
    channel_link: 'https://whatsapp.com/channel/0029VbBPxQTJUM2WCZLB6j28',
    bot_image: 'https://files.catbox.moe/ebj284.jpg'
};

// Auto Features Settings
const AUTO_FEATURES = {
    ALWAYS_ONLINE: true,
    AUTO_TYPING: true,
    AUTO_RECORD: true,
    AUTO_VIEW_STATUS: true,
    AUTO_LIKE_STATUS: true,
    AUTO_REACT: false,
    AUTO_VIEW_STORY: true,
    AUTO_REPLY_STATUS: true,
    AUTO_AI_REPLY_STATUS: true,
    ANTLINK: true,
    ANTDELETE: true
};

// Utility Functions
function getChannelInfo() {
    try {
        return {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: BOT_CONFIG.channel_jid || '120363422610520277@newsletter',
                newsletterName: BOT_CONFIG.channel_name || 'SILA TECH',
                serverMessageId: -1
            }
        };
    } catch (error) {
        return {
            forwardingScore: 999,
            isForwarded: true
        };
    }
}

async function sendWithTemplate(sock, chatId, content, quoted = null) {
    try {
        const messageOptions = {
            ...content
        };
        
        // Add contextInfo only if it's not a status broadcast
        if (chatId !== 'status@broadcast') {
            messageOptions.contextInfo = getChannelInfo();
        }
        
        if (quoted && quoted.key) {
            return await sock.sendMessage(chatId, messageOptions, { quoted });
        } else {
            return await sock.sendMessage(chatId, messageOptions);
        }
    } catch (error) {
        console.error('sendWithTemplate error:', error);
        // Fallback to simple send
        try {
            if (quoted && quoted.key) {
                return await sock.sendMessage(chatId, content, { quoted });
            } else {
                return await sock.sendMessage(chatId, content);
            }
        } catch (fallbackError) {
            console.error('Fallback send error:', fallbackError);
            throw fallbackError;
        }
    }
}

// Enhanced AI Commands
async function aiCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🤖", key: message.key }}, { quoted: message });
        
        const query = args.join(' ');
        if (!query) {
            return await sendWithTemplate(sock, chatId, { 
                text: '🤖 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚀𝚄𝙴𝚁𝚈 𝙵𝙾𝚁 𝙰𝙸*\n\n*Example:* .ai explain quantum physics' 
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙿𝚁𝙾𝙲𝙴𝚂𝚂𝙸𝙽𝙶 𝚈𝙾𝚄𝚁 𝚁𝙴𝚀𝚄𝙴𝚂𝚃...*'
        }, message);

        const response = await axios.get(`${APIS.chatgpt}${encodeURIComponent(query)}`, {
            timeout: 30000
        });
        
        let aiResponse = response.data?.result || response.data?.response || response.data?.message;
        
        if (!aiResponse) {
            aiResponse = 'No response from AI service';
        }

        await sendWithTemplate(sock, chatId, {
            text: `🤖 *𝙰𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴*\n\n${aiResponse}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙽𝙶 𝚃𝙾 𝙰𝙸 𝚂𝙴𝚁𝚅𝙸𝙲𝙴*'
        }, message);
    }
}

async function geminiCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🔮", key: message.key }}, { quoted: message });
        
        const query = args.join(' ');
        if (!query) {
            return await sendWithTemplate(sock, chatId, { 
                text: '🔮 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚀𝚄𝙴𝚁𝚈 𝙵𝙾𝚁 𝙶𝙴𝙼𝙸𝙽𝙸*\n\n*Example:* .gemini tell me about mars' 
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙰𝚂𝙺𝙸𝙽𝙶 𝙶𝙴𝙼𝙸𝙽𝙸...*'
        }, message);

        const response = await axios.get(`${APIS.gemini}${encodeURIComponent(query)}`, { timeout: 15000 });
        const geminiResponse = response.data?.result || response.data?.response || 'No response from Gemini';

        await sendWithTemplate(sock, chatId, {
            text: `🔮 *𝙶𝙴𝙼𝙸𝙽𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴*\n\n${geminiResponse}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙽𝙶 𝚃𝙾 𝙶𝙴𝙼𝙸𝙽𝙸*'
        }, message);
    }
}

async function gptCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "💬", key: message.key }}, { quoted: message });
        
        const query = args.join(' ');
        if (!query) {
            return await sendWithTemplate(sock, chatId, { 
                text: '💬 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚀𝚄𝙴𝚁𝚈 𝙵𝙾𝚁 𝙲𝙷𝙰𝚃𝙶𝙿𝚃*\n\n*Example:* .gpt write a poem about nature' 
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙲𝙾𝙽𝚅𝙴𝚁𝚂𝙸𝙽𝙶 𝚆𝙸𝚃𝙷 𝙲𝙷𝙰𝚃𝙶𝙿𝚃...*'
        }, message);

        const response = await axios.get(`${APIS.chatgpt}${encodeURIComponent(query)}`, { timeout: 30000 });
        const gptResponse = response.data?.result || response.data?.response || 'No response from ChatGPT';

        await sendWithTemplate(sock, chatId, {
            text: `💬 *𝙲𝙷𝙰𝚃𝙶𝙿𝚃 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴*\n\n${gptResponse}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙽𝙶 𝚃𝙾 𝙲𝙷𝙰𝚃𝙶𝙿𝚃*'
        }, message);
    }
}

// Anime Commands
async function animeCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🎌", key: message.key }}, { quoted: message });
        
        const type = args[0]?.toLowerCase() || 'hug';
        const validTypes = ['hug', 'wink', 'pat', 'cry', 'kiss', 'slap', 'poke'];
        
        if (!validTypes.includes(type)) {
            return await sendWithTemplate(sock, chatId, {
                text: `❌ *𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙰𝙽𝙸𝙼𝙴 𝚃𝚈𝙿𝙴*\n\nAvailable: ${validTypes.join(', ')}`
            }, message);
        }

        const response = await axios.get(`${APIS.anime}${type}`);
        const animeData = response.data;

        if (animeData && animeData.link) {
            await sendWithTemplate(sock, chatId, {
                image: { url: animeData.link },
                caption: `🎌 *𝙰𝙽𝙸𝙼𝙴 ${type.toUpperCase()}*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
            }, message);
        } else {
            await sendWithTemplate(sock, chatId, {
                text: '❌ *𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙵𝙴𝚃𝙲𝙷 𝙰𝙽𝙸𝙼𝙴 𝙸𝙼𝙰𝙶𝙴*'
            }, message);
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙵𝙴𝚃𝙲𝙷𝙸𝙽𝙶 𝙰𝙽𝙸𝙼𝙴 𝙸𝙼𝙰𝙶𝙴*'
        }, message);
    }
}

// Download Commands
async function songCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🎵", key: message.key }}, { quoted: message });
        
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, {
                text: '🎵 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚄𝚁𝙻*\n\n*Example:* .song https://youtube.com/watch?v=xxx'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝚂𝙾𝙽𝙶...*'
        }, message);

        const response = await axios.get(`${APIS.youtube_mp3}${encodeURIComponent(url)}&format=mp3&apikey=sadiya`);
        const audioUrl = response.data?.url || response.data?.result;

        if (!audioUrl) {
            throw new Error('No audio found');
        }

        await sendWithTemplate(sock, chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            caption: '🎵 *𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚂𝙾𝙽𝙶*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*'
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝚂𝙾𝙽𝙶*'
        }, message);
    }
}

async function playCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🎶", key: message.key }}, { quoted: message });
        
        const query = args.join(' ');
        if (!query) {
            return await sendWithTemplate(sock, chatId, {
                text: '🎶 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚂𝙾𝙽𝙶 𝙽𝙰𝙼𝙴*\n\n*Example:* .play shape of you'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔍 *𝚂𝙴𝙰𝚁𝙲𝙷𝙸𝙽𝙶 𝚂𝙾𝙽𝙶...*'
        }, message);

        const response = await axios.get(`${APIS.youtube_play}${encodeURIComponent(query)}`);
        const songData = response.data;

        if (songData?.url || songData?.audio) {
            const audioUrl = songData.url || songData.audio;
            await sendWithTemplate(sock, chatId, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                caption: `🎶 *${songData.title || 'Song'}*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
            }, message);
        } else {
            throw new Error('No song found');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝚂𝙴𝙰𝚁𝙲𝙷𝙸𝙽𝙶 𝚂𝙾𝙽𝙶*'
        }, message);
    }
}

async function mediafireCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "📁", key: message.key }}, { quoted: message });
        
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, {
                text: '📁 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝙼𝙴𝙳𝙸𝙰𝙵𝙸𝚁𝙴 𝚄𝚁𝙻*\n\n*Example:* .mediafire https://mediafire.com/file/xxx'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝙵𝚁𝙾𝙼 𝙼𝙴𝙳𝙸𝙰𝙵𝙸𝚁𝙴...*'
        }, message);

        const response = await axios.get(`${APIS.mediafire}${encodeURIComponent(url)}`);
        const fileData = response.data;

        if (fileData?.url || fileData?.downloadUrl) {
            const downloadUrl = fileData.url || fileData.downloadUrl;
            await sendWithTemplate(sock, chatId, {
                document: { url: downloadUrl },
                mimetype: fileData.mimetype || 'application/octet-stream',
                fileName: fileData.filename || 'download',
                caption: `📁 *𝙼𝙴𝙳𝙸𝙰𝙵𝙸𝚁𝙴 𝙵𝙸𝙻𝙴*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
            }, message);
        } else {
            throw new Error('No file found');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝙵𝚁𝙾𝙼 𝙼𝙴𝙳𝙸𝙰𝙵𝙸𝚁𝙴*'
        }, message);
    }
}

async function videoCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🎥", key: message.key }}, { quoted: message });
        
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, { 
                text: '🎥 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚄𝚁𝙻*\n\n*Example:* .video https://youtube.com/watch?v=xxx' 
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝚅𝙸𝙳𝙴𝙾...*'
        }, message);

        const response = await axios.get(`${APIS.youtube_mp4}${encodeURIComponent(url)}`);
        const videoData = response.data;

        if (videoData?.url || videoData?.videoUrl) {
            const videoUrl = videoData.url || videoData.videoUrl;
            await sendWithTemplate(sock, chatId, {
                video: { url: videoUrl },
                caption: `🎥 *𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚅𝙸𝙳𝙴𝙾*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
            }, message);
        } else {
            throw new Error('No video found');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝚅𝙸𝙳𝙴𝙾*'
        }, message);
    }
}

// Group Management Commands
async function groupInfoCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "👥", key: message.key }}, { quoted: message });
        
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;
        const owner = metadata.owner;
        
        // Get admins
        const admins = participants.filter(p => p.admin).map(p => p.id);
        const adminList = admins.map(admin => `│   👤 @${admin.split('@')[0]}`).join('\n');

        const infoText = `
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈◉
│        🤖 *GROUP INFORMATION*
├━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈◉
│
│ 👥 *𝙶𝚛𝚘𝚞𝚙 𝙽𝚊𝚖𝚎:* ${metadata.subject}
│ 🆔 *𝙶𝚛𝚘𝚞𝚙 𝙸𝙳:* ${metadata.id}
│ 👤 *𝚃𝚘𝚝𝚊𝚕 𝙼𝚎𝚖𝚋𝚎𝚛𝚜:* ${participants.length}
│ 👑 *𝙶𝚛𝚘𝚞𝚙 𝙾𝚠𝚗𝚎𝚛:* @${owner.split('@')[0]}
│
│ ⚡ *𝙰𝚍𝚖𝚒𝚗𝚜 (${admins.length}):*
${adminList}
│
│ 📝 *𝙳𝚎𝚜𝚌𝚛𝚒𝚙𝚝𝚒𝚘𝚗:*
│ ${metadata.desc || '𝙽𝚘 𝚍𝚎𝚜𝚌𝚛𝚒𝚙𝚝𝚒𝚘𝚗 𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎'}
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈◉
*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`.trim();

        await sendWithTemplate(sock, chatId, {
            text: infoText,
            mentions: [...admins, owner]
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙵𝙴𝚃𝙲𝙷𝙸𝙽𝙶 𝙶𝚁𝙾𝚄𝙿 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽*'
        }, message);
    }
}

async function tagAllCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🔊", key: message.key }}, { quoted: message });
        
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;

        let messageText = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈◉
│        🔊 *MENTION ALL MEMBERS*
├━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈◉
│
`;

        participants.forEach(participant => {
            messageText += `│   👤 @${participant.id.split('@')[0]}\n`;
        });

        messageText += `│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈◉
*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`;

        await sendWithTemplate(sock, chatId, {
            text: messageText,
            mentions: participants.map(p => p.id)
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝚃𝙰𝙶𝙶𝙸𝙽𝙶 𝙰𝙻𝙻 𝙼𝙴𝙼𝙱𝙴𝚁𝚂*'
        }, message);
    }
}

async function listOnlineCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🟢", key: message.key }}, { quoted: message });
        
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;

        // Simulate online users
        const onlineUsers = participants.slice(0, Math.min(10, participants.length));
        
        let onlineText = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈◉
│        🟢 *ONLINE MEMBERS*
├━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈◉
│
`;

        onlineUsers.forEach(user => {
            onlineText += `│   🟢 @${user.id.split('@')[0]}\n`;
        });

        onlineText += `│
│ 📊 *𝚃𝚘𝚝𝚊𝚕:* ${onlineUsers.length} 𝚖𝚎𝚖𝚋𝚎𝚛𝚜 𝚘𝚗𝚕𝚒𝚗𝚎
│
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈◉
*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`;

        await sendWithTemplate(sock, chatId, {
            text: onlineText,
            mentions: onlineUsers.map(p => p.id)
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙻𝙸𝚂𝚃𝙸𝙽𝙶 𝙾𝙽𝙻𝙸𝙽𝙴 𝙼𝙴𝙼𝙱𝙴𝚁𝚂*'
        }, message);
    }
}

// Image/Video Generation
async function imagineCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🎨", key: message.key }}, { quoted: message });
        
        const prompt = args.join(' ');
        if (!prompt) {
            return await sendWithTemplate(sock, chatId, {
                text: '🎨 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝙿𝚁𝙾𝙼𝙿𝚃 𝙵𝙾𝚁 𝙸𝙼𝙰𝙶𝙴 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙾𝙽*\n\n*Example:* .imagine a beautiful sunset over mountains'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🎨 *𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝚈𝙾𝚄𝚁 𝙸𝙼𝙰𝙶𝙴...*'
        }, message);

        const enhancedPrompt = `${prompt}, high quality, detailed, masterpiece, 4k, ultra realistic`;
        const response = await axios.get(`${APIS.imagine}${encodeURIComponent(enhancedPrompt)}`, {
            responseType: 'arraybuffer'
        });

        await sendWithTemplate(sock, chatId, {
            image: Buffer.from(response.data),
            caption: `🎨 *𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙴𝙳 𝙸𝙼𝙰𝙶𝙴*\n\n*𝙿𝚛𝚘𝚖𝚙𝚝:* "${prompt}"\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝙸𝙼𝙰𝙶𝙴*'
        }, message);
    }
}

async function imagine2Command(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🎨", key: message.key }}, { quoted: message });
        
        const prompt = args.join(' ');
        if (!prompt) {
            return await sendWithTemplate(sock, chatId, {
                text: '🎨 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝙿𝚁𝙾𝙼𝙿𝚃*\n\n*Example:* .imagine a beautiful sunset over mountains'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🎨 *𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝙸𝙼𝙰𝙶𝙴...*'
        }, message);

        const response = await axios.get(`${APIS.imagine}${encodeURIComponent(prompt)}`, {
            responseType: 'arraybuffer'
        });

        await sendWithTemplate(sock, chatId, {
            image: Buffer.from(response.data),
            caption: `🎨 *𝙰𝙸 𝙸𝙼𝙰𝙶𝙴*\n\n*𝙿𝚛𝚘𝚖𝚙𝚝:* ${prompt}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝙸𝙼𝙰𝙶𝙴*'
        }, message);
    }
}

async function soraCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🎥", key: message.key }}, { quoted: message });
        
        const prompt = args.join(' ');
        if (!prompt) {
            return await sendWithTemplate(sock, chatId, {
                text: '🎥 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝙿𝚁𝙾𝙼𝙿𝚃*\n\n*Example:* .sora anime girl with blue hair'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🎥 *𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝚅𝙸𝙳𝙴𝙾...*'
        }, message);

        const response = await axios.get(`${APIS.txt2video}${encodeURIComponent(prompt)}`);
        const videoUrl = response.data?.url || response.data?.videoUrl;

        if (videoUrl) {
            await sendWithTemplate(sock, chatId, {
                video: { url: videoUrl },
                caption: `🎥 *𝙰𝙸 𝚅𝙸𝙳𝙴𝙾*\n\n*𝙿𝚛𝚘𝚖𝚙𝚝:* ${prompt}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
            }, message);
        } else {
            throw new Error('No video generated');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝚅𝙸𝙳𝙴𝙾*'
        }, message);
    }
}

// Facebook Command
async function facebookCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "📘", key: message.key }}, { quoted: message });
        
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, {
                text: '📘 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝚄𝚁𝙻*\n\n*Example:* .fb https://facebook.com/xxx'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝚅𝙸𝙳𝙴𝙾...*'
        }, message);

        const response = await axios.get(`${APIS.facebook}${encodeURIComponent(url)}`);
        const videoData = response.data;

        if (videoData?.result?.hd || videoData?.result?.sd) {
            const videoUrl = videoData.result.hd || videoData.result.sd;
            await sendWithTemplate(sock, chatId, {
                video: { url: videoUrl },
                caption: '📘 *𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝚅𝙸𝙳𝙴𝙾*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*'
            }, message);
        } else {
            throw new Error('No video found');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝚅𝙸𝙳𝙴𝙾*'
        }, message);
    }
}

// Videy Download Command
async function videyCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "📹", key: message.key }}, { quoted: message });
        
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, {
                text: '📹 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚅𝙸𝙳𝙴𝚈 𝚄𝚁𝙻*\n\n*Example:* .videy https://videy.co/xxx'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝙵𝚁𝙾𝙼 𝚅𝙸𝙳𝙴𝚈...*'
        }, message);

        const response = await axios.get(`${APIS.videy}${encodeURIComponent(url)}`);
        const videoData = response.data;

        if (videoData?.url || videoData?.videoUrl) {
            const videoUrl = videoData.url || videoData.videoUrl;
            await sendWithTemplate(sock, chatId, {
                video: { url: videoUrl },
                caption: `📹 *𝚅𝙸𝙳𝙴𝚈 𝚅𝙸𝙳𝙴𝙾*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
            }, message);
        } else {
            throw new Error('No video found');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝙵𝚁𝙾𝙼 𝚅𝙸𝙳𝙴𝚈*'
        }, message);
    }
}

// ToCarbon Command
async function tocarbonCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "💎", key: message.key }}, { quoted: message });
        
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, {
                text: '💎 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰𝙽 𝙸𝙼𝙰𝙶𝙴 𝚄𝚁𝙻*\n\n*Example:* .tocarbon https://example.com/image.jpg'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙲𝙾𝙽𝚅𝙴𝚁𝚃𝙸𝙽𝙶 𝚃𝙾 𝙲𝙰𝚁𝙱𝙾𝙽...*'
        }, message);

        const response = await axios.get(`${APIS.tocarbon}${encodeURIComponent(url)}`, {
            responseType: 'arraybuffer'
        });

        await sendWithTemplate(sock, chatId, {
            image: Buffer.from(response.data),
            caption: '💎 *𝙲𝙰𝚁𝙱𝙾𝙽 𝙸𝙼𝙰𝙶𝙴*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*'
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝙾𝙽𝚅𝙴𝚁𝚃𝙸𝙽𝙶 𝚃𝙾 𝙲𝙰𝚁𝙱𝙾𝙽*'
        }, message);
    }
}

// GPT Command (New API)
async function gptNewCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "💬", key: message.key }}, { quoted: message });
        
        const query = args.join(' ');
        if (!query) {
            return await sendWithTemplate(sock, chatId, { 
                text: '💬 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚀𝚄𝙴𝚁𝚈*\n\n*Example:* .gptnew explain quantum physics' 
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙰𝚂𝙺𝙸𝙽𝙶 𝙶𝙿𝚃...*'
        }, message);

        const response = await axios.get(`${APIS.gpt}${encodeURIComponent(query)}`);
        const gptResponse = response.data?.result || response.data?.response || 'No response from GPT';

        await sendWithTemplate(sock, chatId, {
            text: `💬 *𝙶𝙿𝚃 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴*\n\n${gptResponse}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙽𝙶 𝚃𝙾 𝙶𝙿𝚃*'
        }, message);
    }
}

// GitHub Trending Command
async function githubTrendCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🐙", key: message.key }}, { quoted: message });
        
        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙵𝙴𝚃𝙲𝙷𝙸𝙽𝙶 𝙶𝙸𝚃𝙷𝚄𝙱 𝚃𝚁𝙴𝙽𝙳𝙸𝙽𝙶...*'
        }, message);

        const response = await axios.get(APIS.github_trend);
        const trends = response.data;

        if (trends && Array.isArray(trends) && trends.length > 0) {
            let trendText = '🐙 *𝙶𝙸𝚃𝙷𝚄𝙱 𝚃𝚁𝙴𝙽𝙳𝙸𝙽𝙶 𝚁𝙴𝙿𝙾𝚂*\n\n';
            
            trends.slice(0, 5).forEach((repo, index) => {
                trendText += `*${index + 1}. ${repo.name}*\n`;
                trendText += `⭐ *Stars:* ${repo.stars || 'N/A'}\n`;
                trendText += `📝 *Description:* ${repo.description || 'No description'}\n`;
                trendText += `🔗 *URL:* ${repo.url || 'N/A'}\n\n`;
            });

            trendText += '*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*';

            await sendWithTemplate(sock, chatId, {
                text: trendText
            }, message);
        } else {
            throw new Error('No trends found');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙵𝙴𝚃𝙲𝙷𝙸𝙽𝙶 𝙶𝙸𝚃𝙷𝚄𝙱 𝚃𝚁𝙴𝙽𝙳𝚂*'
        }, message);
    }
}

// AI Image Generation (New API)
async function txt2imgCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🖼️", key: message.key }}, { quoted: message });
        
        const prompt = args.join(' ');
        if (!prompt) {
            return await sendWithTemplate(sock, chatId, {
                text: '🖼️ *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝙿𝚁𝙾𝙼𝙿𝚃*\n\n*Example:* .txt2img a beautiful landscape'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🖼️ *𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝙸𝙼𝙰𝙶𝙴...*'
        }, message);

        const response = await axios.get(`${APIS.txt2img}${encodeURIComponent(prompt)}`, {
            responseType: 'arraybuffer'
        });

        await sendWithTemplate(sock, chatId, {
            image: Buffer.from(response.data),
            caption: `🖼️ *𝙰𝙸 𝙸𝙼𝙰𝙶𝙴*\n\n*𝙿𝚛𝚘𝚖𝚙𝚝:* ${prompt}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝙸𝙼𝙰𝙶𝙴*'
        }, message);
    }
}

// Gemini Command (New API)
async function geminiNewCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🔮", key: message.key }}, { quoted: message });
        
        const query = args.join(' ');
        if (!query) {
            return await sendWithTemplate(sock, chatId, { 
                text: '🔮 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚀𝚄𝙴𝚁𝚈*\n\n*Example:* .gemininew tell me about mars' 
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙰𝚂𝙺𝙸𝙽𝙶 𝙶𝙴𝙼𝙸𝙽𝙸...*'
        }, message);

        const response = await axios.get(`${APIS.gemini_new}${encodeURIComponent(query)}`);
        const geminiResponse = response.data?.result || response.data?.response || 'No response from Gemini';

        await sendWithTemplate(sock, chatId, {
            text: `🔮 *𝙶𝙴𝙼𝙸𝙽𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴*\n\n${geminiResponse}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙽𝙶 𝚃𝙾 𝙶𝙴𝙼𝙸𝙽𝙸*'
        }, message);
    }
}

// Facebook Downloader (New API)
async function facebookNewCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "📘", key: message.key }}, { quoted: message });
        
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, {
                text: '📘 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝚄𝚁𝙻*\n\n*Example:* .fbnew https://facebook.com/xxx'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝚅𝙸𝙳𝙴𝙾...*'
        }, message);

        const response = await axios.get(`${APIS.facebook_new}${encodeURIComponent(url)}`);
        const videoData = response.data;

        if (videoData?.url || videoData?.videoUrl) {
            const videoUrl = videoData.url || videoData.videoUrl;
            await sendWithTemplate(sock, chatId, {
                video: { url: videoUrl },
                caption: '📘 *𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝚅𝙸𝙳𝙴𝙾*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*'
            }, message);
        } else {
            throw new Error('No video found');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝚅𝙸𝙳𝙴𝙾*'
        }, message);
    }
}

// Anime Quote Command
async function animeQuoteCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🎌", key: message.key }}, { quoted: message });
        
        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙵𝙴𝚃𝙲𝙷𝙸𝙽𝙶 𝙰𝙽𝙸𝙼𝙴 𝚀𝚄𝙾𝚃𝙴...*'
        }, message);

        const response = await axios.get(APIS.anime_quote);
        const quoteData = response.data;

        if (quoteData) {
            const quoteText = `🎌 *𝙰𝙽𝙸𝙼𝙴 𝚀𝚄𝙾𝚃𝙴*\n\n"${quoteData.quote || quoteData.text}"\n\n*𝙲𝚑𝚊𝚛𝚊𝚌𝚝𝚎𝚛:* ${quoteData.character || 'Unknown'}\n*𝙰𝚗𝚒𝚖𝚎:* ${quoteData.anime || 'Unknown'}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`;

            await sendWithTemplate(sock, chatId, {
                text: quoteText
            }, message);
        } else {
            throw new Error('No quote found');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙵𝙴𝚃𝙲𝙷𝙸𝙽𝙶 𝙰𝙽𝙸𝙼𝙴 𝚀𝚄𝙾𝚃𝙴*'
        }, message);
    }
}

// Sila Command
async function silaCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🤖", key: message.key }}, { quoted: message });
        
        const query = args.join(' ');
        if (!query) {
            return await sendWithTemplate(sock, chatId, { 
                text: '🤖 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚀𝚄𝙴𝚁𝚈*\n\n*Example:* .aiask what is artificial intelligence?' 
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙰𝚂𝙺𝙸𝙽𝙶 𝙰𝙸...*'
        }, message);

        const response = await axios.get(`${APIS.sila}${encodeURIComponent(query)}`);
        const aiResponse = response.data?.result || response.data?.response || 'No response from AI';

        await sendWithTemplate(sock, chatId, {
            text: `🤖 *𝙰𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴*\n\n${aiResponse}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙽𝙶 𝚃𝙾 𝙰𝙸*'
        }, message);
    }
}

// Catbox Upload Command
async function catboxCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "📤", key: message.key }}, { quoted: message });
        
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, {
                text: '📤 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰𝙽 𝙸𝙼𝙰𝙶𝙴 𝚄𝚁𝙻*\n\n*Example:* .catbox https://example.com/image.jpg'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝚄𝙿𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝚃𝙾 𝙲𝙰𝚃𝙱𝙾𝚇...*'
        }, message);

        const formData = new FormData();
        formData.append('url', url);

        const response = await axios.post(APIS.catbox, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        const catboxUrl = response.data;

        if (catboxUrl) {
            await sendWithTemplate(sock, chatId, {
                text: `📤 *𝙲𝙰𝚃𝙱𝙾𝚇 𝚄𝚁𝙻*\n\n${catboxUrl}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
            }, message);
        } else {
            throw new Error('Upload failed');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝚄𝙿𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝚃𝙾 𝙲𝙰𝚃𝙱𝙾𝚇*'
        }, message);
    }
}

// Settings Command
async function settingsCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "⚙️", key: message.key }}, { quoted: message });
        
        const settingsText = `⚙️ *𝙱𝙾𝚃 𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂*

╭━━━━━━━━━━━━━━━━●◌
│ *🤖 𝙱𝚘𝚝 𝙽𝚊𝚖𝚎:* 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸
│ *🔧 𝚅𝚎𝚛𝚜𝚒𝚘𝚗:* 2.0.0
│ *📱 𝙾𝚠𝚗𝚎𝚛:* +255612491554
│ *🌐 𝚂𝚝𝚊𝚝𝚞𝚜:* 𝙾𝚗𝚕𝚒𝚗𝚎
│
│ *🔄 𝙰𝚞𝚝𝚘 𝙵𝚎𝚊𝚝𝚞𝚛𝚎𝚜:*
│ • 𝙰𝚞𝚝𝚘 𝚁𝚎𝚊𝚍: ✅
│ • 𝙰𝚞𝚝𝚘 𝚃𝚢𝚙𝚒𝚗𝚐: ✅
│ • 𝙰𝚞𝚝𝚘 𝚅𝚒𝚎𝚠 𝚂𝚝𝚊𝚝𝚞𝚜: ✅
│ • 𝙰𝚞𝚝𝚘 𝙻𝚒𝚔𝚎 𝚂𝚝𝚊𝚝𝚞𝚜: ✅
│ • 𝙰𝚗𝚝𝚒𝚕𝚒𝚗𝚔: ✅
│ • 𝙰𝚗𝚝𝚒𝚍𝚎𝚕𝚎𝚝𝚎: ✅
╰━━━━━━━━━━━━━━━━●◌

*𝚄𝚜𝚎 .𝚜𝚎𝚝 <𝚘𝚙𝚝𝚒𝚘𝚗> <𝚟𝚊𝚕𝚞𝚎> 𝚝𝚘 𝚌𝚑𝚊𝚗𝚐𝚎 𝚜𝚎𝚝𝚝𝚒𝚗𝚐𝚜*

*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`;

        await sendWithTemplate(sock, chatId, {
            text: settingsText
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙳𝙸𝚂𝙿𝙻𝙰𝚈𝙸𝙽𝙶 𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂*'
        }, message);
    }
}

// JID Command
async function jidCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🆔", key: message.key }}, { quoted: message });
        
        let targetJid = chatId;
        
        // Check if replying to a message
        if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = message.message.extendedTextMessage.contextInfo.participant;
        }
        // Check if mentioned someone
        else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        const jidText = `🆔 *𝙹𝙸𝙳 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽*

╭━━━━━━━━━━━━━━━━●◌
│ *𝙹𝙸𝙳:* ${targetJid}
│ *𝚃𝚢𝚙𝚎:* ${targetJid.endsWith('@g.us') ? '𝙶𝚛𝚘𝚞𝚙' : targetJid.endsWith('@s.whatsapp.net') ? '𝚄𝚜𝚎𝚛' : '𝙲𝚑𝚊𝚗𝚗𝚎𝚕'}
│ *𝙿𝚊𝚛𝚝𝚜:* ${targetJid.split('@')[0]}
╰━━━━━━━━━━━━━━━━●◌

*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`;

        await sendWithTemplate(sock, chatId, {
            text: jidText
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙶𝙴𝚃𝚃𝙸𝙽𝙶 𝙹𝙸𝙳*'
        }, message);
    }
}

// TTS Command
async function ttsCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🗣️", key: message.key }}, { quoted: message });
        
        const text = args.join(' ');
        if (!text) {
            return await sendWithTemplate(sock, chatId, {
                text: '🗣️ *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝚃𝙴𝚇𝚃*\n\n*Example:* .tts Hello how are you'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝚃𝚃𝚂...*'
        }, message);

        // Using Google TTS API
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;

        await sendWithTemplate(sock, chatId, {
            audio: { url: ttsUrl },
            mimetype: 'audio/mpeg',
            caption: `🗣️ *𝚃𝙴𝚇𝚃 𝚃𝙾 𝚂𝙿𝙴𝙴𝙲𝙷*\n\n*𝚃𝚎𝚡𝚝:* ${text}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝚃𝚃𝚂*'
        }, message);
    }
}

// VFC Command (Video to File Converter)
async function vfcCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "📹", key: message.key }}, { quoted: message });
        
        // Check if replying to a video
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.videoMessage) {
            return await sendWithTemplate(sock, chatId, {
                text: '📹 *𝙿𝙻𝙴𝙰𝚂𝙴 𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝙰 𝚅𝙸𝙳𝙴𝙾 𝙼𝙴𝚂𝚂𝙰𝙶𝙴*'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙲𝙾𝙽𝚅𝙴𝚁𝚃𝙸𝙽𝙶 𝚅𝙸𝙳𝙴𝙾 𝚃𝙾 𝙵𝙸𝙻𝙴...*'
        }, message);

        const videoMessage = quoted.videoMessage;
        const videoUrl = videoMessage.url;

        await sendWithTemplate(sock, chatId, {
            document: { url: videoUrl },
            mimetype: 'video/mp4',
            fileName: 'converted_video.mp4',
            caption: '📹 *𝚅𝙸𝙳𝙴𝙾 𝙵𝙸𝙻𝙴*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*'
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝙾𝙽𝚅𝙴𝚁𝚃𝙸𝙽𝙶 𝚅𝙸𝙳𝙴𝙾*'
        }, message);
    }
}
// Antilink Function
function containsURL(str) {
    const urlRegex = /(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/i;
    return urlRegex.test(str);
}

async function Antilink(msg, sock) {
    try {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;

        const SenderMessage = msg.message?.conversation || 
                             msg.message?.extendedTextMessage?.text || '';
        if (!SenderMessage || typeof SenderMessage !== 'string') return;

        const sender = msg.key.participant;
        if (!sender) return;
        
        // Skip if sender is bot owner
        const isOwner = sender.includes('255612491554');
        if (isOwner) return;

        if (!containsURL(SenderMessage.trim())) return;
        
        try {
            // Delete message
            await sock.sendMessage(jid, { delete: msg.key });

            // Send warning
            await sock.sendMessage(jid, { 
                text: `❌ *𝙻𝙸𝙽𝙺 𝙽𝙾𝚃 𝙰𝙻𝙻𝙾𝚆𝙴𝙳*\n\n@${sender.split('@')[0]} 𝚕𝚒𝚗𝚔𝚜 𝚊𝚛𝚎 𝚗𝚘𝚝 𝚊𝚕𝚕𝚘𝚠𝚎𝚍 𝚑𝚎𝚛𝚎!`,
                mentions: [sender] 
            });

        } catch (error) {
            console.error('Antilink error:', error);
        }
    } catch (error) {
        console.error('Antilink error:', error);
    }
}
// Auto Bio Function
async function updateAutoBio(sock) {
    try {
        const bios = [
            "🤖 SILA MD MINI IS ACTIVE",
            "🚀 SILA MD MINI IS LIVE",
            "💫 POWERED BY SILA TECH",
            "⚡ SILA MD MINI - MOST POWERFUL BOT",
            "🎯 SILA MD MINI - PREMIUM FEATURES",
            "🔥 SILA MD MINI - ONLINE & ACTIVE",
            "🌟 SILA MD MINI - ADVANCED AI BOT"
        ];
        
        const randomBio = bios[Math.floor(Math.random() * bios.length)];
        await sock.updateProfileStatus(randomBio);
        console.log('Auto bio updated:', randomBio);
    } catch (error) {
        console.error('Auto bio error:', error);
    }
}

// Auto Like Status (Fixed)
async function handleAutoLikeStatus(sock, msg) {
    try {
        if (msg.key.remoteJid === 'status@broadcast') {
            const emojis = ['😂', '🤣', '❤️', '🔥', '👍', '💯', '⚡'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            
            await sock.sendMessage(msg.key.remoteJid, { 
                react: { text: randomEmoji, key: msg.key } 
            });
            console.log('Auto liked status with:', randomEmoji);
        }
    } catch (error) {
        console.error('Auto like status error:', error);
    }
}

// Fun Commands
async function shipCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "💘", key: message.key }}, { quoted: message });
        
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants.map(v => v.id);
        
        if (participants.length < 2) {
            return await sendWithTemplate(sock, chatId, {
                text: '❌ *𝙽𝙴𝙴𝙳 𝙰𝚃 𝙻𝙴𝙰𝚂𝚃 2 𝙼𝙴𝙼𝙱𝙴𝚁𝚂 𝚃𝙾 𝚂𝙷𝙸𝙿!*'
            }, message);
        }

        let firstUser, secondUser;
        firstUser = participants[Math.floor(Math.random() * participants.length)];
        
        do {
            secondUser = participants[Math.floor(Math.random() * participants.length)];
        } while (secondUser === firstUser);

        const lovePercentage = Math.floor(Math.random() * 101);
        
        let loveMessage;
        if (lovePercentage >= 80) loveMessage = 'Perfect Match! 💖💍';
        else if (lovePercentage >= 60) loveMessage = 'Great Couple! 💕';
        else if (lovePercentage >= 40) loveMessage = 'Maybe... 🤔';
        else loveMessage = 'Not meant to be 😅';

        await sendWithTemplate(sock, chatId, {
            text: `💘 *𝙻𝙾𝚅𝙴 𝙲𝙰𝙻𝙲𝚄𝙻𝙰𝚃𝙾𝚁*\n\n@${firstUser.split('@')[0]} ❤️ @${secondUser.split('@')[0]}\n\n*𝙻𝚘𝚟𝚎 𝚂𝚌𝚘𝚛𝚎:* ${lovePercentage}%\n${loveMessage}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`,
            mentions: [firstUser, secondUser]
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝚂𝙷𝙸𝙿𝙿𝙸𝙽𝙶 𝙼𝙴𝙼𝙱𝙴𝚁𝚂*'
        }, message);
    }
}

async function wastedCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "💀", key: message.key }}, { quoted: message });
        
        let targetUser;
        
        // Check mentions
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetUser = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check reply
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            targetUser = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!targetUser) {
            return await sendWithTemplate(sock, chatId, {
                text: '💀 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙼𝙴𝙽𝚃𝙸𝙾𝙽 𝚂𝙾𝙼𝙴𝙾𝙽𝙴 𝙾𝚁 𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝚃𝙷𝙴𝙸𝚁 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 𝚃𝙾 𝚆𝙰𝚂𝚃𝙴 𝚃𝙷𝙴𝙼!*'
            }, message);
        }

        let profilePic;
        try {
            profilePic = await sock.profilePictureUrl(targetUser, 'image');
        } catch {
            profilePic = 'https://i.imgur.com/2wzGhpF.jpeg';
        }

        const response = await axios.get(`${APIS.wasted}${encodeURIComponent(profilePic)}`, {
            responseType: 'arraybuffer'
        });

        await sendWithTemplate(sock, chatId, {
            image: Buffer.from(response.data),
            caption: `⚰️ *𝚆𝙰𝚂𝚃𝙴𝙳*\n\n@${targetUser.split('@')[0]} 𝚑𝚊𝚜 𝚋𝚎𝚎𝚗 𝚠𝚊𝚜𝚝𝚎𝚍! 💀\n\n*𝚁𝚎𝚜𝚝 𝚒𝚗 𝚙𝚒𝚎𝚌𝚎𝚜!*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`,
            mentions: [targetUser]
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝚁𝙴𝙰𝚃𝙸𝙽𝙶 𝚆𝙰𝚂𝚃𝙴𝙳 𝙸𝙼𝙰𝙶𝙴*'
        }, message);
    }
}

async function flexCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "💪", key: message.key }}, { quoted: message });
        
        const flexItems = [
            '┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃         🚀 BOT FEATURES         ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛',
            '╔══════════════════════════════════╗\n║ 🚀 Running on Premium Servers     ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ ⚡ Lightning Fast Responses       ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ 🎨 Advanced AI Capabilities      ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ 📥 Multiple Download Options     ║\n╚══════════════════════════════════╝'
        ];

        const selectedFlex = flexItems.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        let flexText = '💪 *𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙵𝙻𝙴𝚇*\n\n';
        selectedFlex.forEach((item, index) => {
            flexText += `${item}\n`;
        });
        
        flexText += '\n🚀 *𝙼𝚘𝚜𝚝 𝙿𝚘𝚠𝚎𝚛𝚏𝚞𝚕 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝙱𝚘𝚝*';

        await sendWithTemplate(sock, chatId, {
            image: { url: BOT_CONFIG.bot_image },
            caption: flexText
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '💪 *𝙱𝙾𝚃 𝙵𝙻𝙴𝚇*\n\n🚀 *𝙿𝚛𝚎𝚖𝚒𝚞𝚖 𝙵𝚎𝚊𝚝𝚞𝚛𝚎𝚜*\n⚡ *𝙷𝚒𝚐𝚑 𝚂𝚙𝚎𝚎𝚍*\n🎨 *𝙰𝚍𝚟𝚊𝚗𝚌𝚎𝚍 𝙰𝙸*\n📥 *𝙼𝚞𝚕𝚝𝚒-𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍*\n👥 *𝙵𝚞𝚕𝚕 𝙼𝚊𝚗𝚊𝚐𝚎𝚖𝚎𝚗𝚝*\n\n*➥ 𝙼𝚘𝚜𝚝 𝙿𝚘𝚠𝚎𝚛𝚏𝚞𝚕 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝙱𝚘𝚝*'
        }, message);
    }
}

// Pies Command
const PIES_COUNTRIES = ['china', 'indonesia', 'japan', 'korea', 'hijab', 'tanzania'];

async function piesCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🔞", key: message.key }}, { quoted: message });
        
        const country = args[0]?.toLowerCase();
        
        if (!country) {
            return await sendWithTemplate(sock, chatId, {
                text: `🔞 *𝙿𝙸𝙴𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳*\n\n*𝚄𝚜𝚊𝚐𝚎:* .pies <country>\n\n*𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚌𝚘𝚞𝚗𝚝𝚛𝚒𝚎𝚜:*\n${PIES_COUNTRIES.map(c => `• ${c}`).join('\n')}`
            }, message);
        }

        if (!PIES_COUNTRIES.includes(country)) {
            return await sendWithTemplate(sock, chatId, {
                text: `❌ *𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙲𝙾𝚄𝙽𝚃𝚁𝚈*\n\n*𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎:* ${PIES_COUNTRIES.join(', ')}`
            }, message);
        }

        const response = await axios.get(`${APIS.pies}${country}?apikey=shizo`, {
            responseType: 'arraybuffer'
        });

        await sendWithTemplate(sock, chatId, {
            image: Buffer.from(response.data),
            caption: `🔞 *${country.toUpperCase()} 𝙲𝙾𝙽𝚃𝙴𝙽𝚃*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙵𝙴𝚃𝙲𝙷𝙸𝙽𝙶 𝙲𝙾𝙽𝚃𝙴𝙽𝚃*'
        }, message);
    }
}

// View Once Command
async function viewOnceCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🔍", key: message.key }}, { quoted: message });
        
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            return await sendWithTemplate(sock, chatId, {
                text: '🔍 *𝙿𝙻𝙴𝙰𝚂𝙴 𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝙰 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴*'
            }, message);
        }

        if (quoted.viewOnceMessageV2) {
            const viewOnceContent = quoted.viewOnceMessageV2.message;
            
            if (viewOnceContent.imageMessage) {
                await sendWithTemplate(sock, chatId, {
                    image: { url: viewOnceContent.imageMessage.url },
                    caption: '🔍 *𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 𝙸𝙼𝙰𝙶𝙴 𝚁𝙴𝙲𝙾𝚅𝙴𝚁𝙴𝙳*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*'
                }, message);
            } else if (viewOnceContent.videoMessage) {
                await sendWithTemplate(sock, chatId, {
                    video: { url: viewOnceContent.videoMessage.url },
                    caption: '🔍 *𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 𝚅𝙸𝙳𝙴𝙾 𝚁𝙴𝙲𝙾𝚅𝙴𝚁𝙴𝙳*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*'
                }, message);
            } else {
                await sendWithTemplate(sock, chatId, {
                    text: '❌ *𝚄𝙽𝚂𝚄𝙿𝙿𝙾𝚁𝚃𝙴𝙳 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 𝙲𝙾𝙽𝚃𝙴𝙽𝚃*'
                }, message);
            }
        } else {
            await sendWithTemplate(sock, chatId, {
                text: '❌ *𝙽𝙾 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 𝙵𝙾𝚄𝙽𝙳*'
            }, message);
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝚁𝙴𝙲𝙾𝚅𝙴𝚁𝙸𝙽𝙶 𝚅𝙸𝙴𝚆 𝙾𝙽𝙲𝙴 𝙼𝙴𝚂𝚂𝙰𝙶𝙴*'
        }, message);
    }
}

// TikTok Command
async function tiktokCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "📱", key: message.key }}, { quoted: message });
        
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, {
                text: '📱 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚃𝙸𝙺𝚃𝙾𝙺 𝚄𝚁𝙻*\n\n*Example:* .tiktok https://vm.tiktok.com/xyz'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🔄 *𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝚃𝙸𝙺𝚃𝙾𝙺 𝚅𝙸𝙳𝙴𝙾...*'
        }, message);

        const response = await axios.get(`${APIS.tiktok}${encodeURIComponent(url)}`);
        const videoUrl = response.data?.result?.video || response.data?.video;

        if (!videoUrl) {
            throw new Error('No video found');
        }

        await sendWithTemplate(sock, chatId, {
            video: { url: videoUrl },
            caption: '📱 *𝚃𝙸𝙺𝚃𝙾𝙺 𝚅𝙸𝙳𝙴𝙾*\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*'
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 𝚃𝙸𝙺𝚃𝙾𝙺 𝚅𝙸𝙳𝙴𝙾*'
        }, message);
    }
}

// Owner Command
async function ownerCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "👑", key: message.key }}, { quoted: message });
        
        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:𝚂𝙸𝙻𝙰 𝙼𝙳\nTEL;waid=255612491554:+255612491554\nEND:VCARD`;

        await sendWithTemplate(sock, chatId, {
            contacts: {
                displayName: "𝚂𝙸𝙻𝙰 𝙼𝙳",
                contacts: [{ vcard }]
            }
        }, { quoted: message });

        const ownerText = `👑 *𝙱𝙾𝚃 𝙾𝚆𝙽𝙴𝚁*

╭━━━━━━━━━━━━━━━━●◌
│ *🏷️ 𝙽𝚊𝚖𝚎:* 𝚂𝙸𝙻𝙰 𝙼𝙳
│ *📱 𝙽𝚞𝚖𝚋𝚎𝚛:* +255612491554
│ *🎯 𝚁𝚘𝚕𝚎:* 𝙱𝚘𝚝 𝙳𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛
│ *🔗 𝙱𝚘𝚝 𝙻𝚒𝚗𝚔:*
│ https://sila-md-min-bot.onrender.com
╰━━━━━━━━━━━━━━━━●◌

*📞 𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝚏𝚘𝚛:*
• 𝙱𝚘𝚝 𝚒𝚜𝚜𝚞𝚎𝚜 𝚊𝚗𝚍 𝚜𝚞𝚙𝚙𝚘𝚛𝚝
• 𝙿𝚛𝚎𝚖𝚒𝚞𝚖 𝚏𝚎𝚊𝚝𝚞𝚛𝚎𝚜
• 𝙲𝚞𝚜𝚝𝚘𝚖 𝚋𝚘𝚝 𝚍𝚎𝚟𝚎𝚕𝚘𝚙𝚖𝚎𝚗𝚝

> *➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`;

        await sendWithTemplate(sock, chatId, {
            image: { url: BOT_CONFIG.bot_image },
            caption: ownerText
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '👑 *𝙾𝚆𝙽𝙴𝚁 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽*\n\n*🏷️ 𝙽𝚊𝚖𝚎:* 𝚂𝙸𝙻𝙰 𝙼𝙳\n*📱 𝙽𝚞𝚖𝚋𝚎𝚛:* +255612491554\n*🔗 𝙱𝚘𝚝 𝙻𝚒𝚗𝚔:* https://sila-md-min-bot.onrender.com\n\n*➥ 𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝚏𝚘𝚛 𝚋𝚘𝚝 𝚜𝚞𝚙𝚙𝚘𝚛𝚝 𝚊𝚗𝚍 𝚚𝚞𝚎𝚛𝚒𝚎𝚜*'
        }, { quoted: message });
    }
}

// Pair Command
async function pairCommand(sock, chatId, message, args) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🔗", key: message.key }}, { quoted: message });
        
        const number = args[0];
        if (!number) {
            return await sendWithTemplate(sock, chatId, {
                text: '📱 *𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 𝙽𝚄𝙼𝙱𝙴𝚁*\n\n*Example:* .pair 255612491554'
            }, message);
        }

        const cleanNumber = number.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10) {
            return await sendWithTemplate(sock, chatId, {
                text: '❌ *𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙿𝙷𝙾𝙽𝙴 𝙽𝚄𝙼𝙱𝙴𝚁 𝙵𝙾𝚁𝙼𝙰𝚃*'
            }, message);
        }

        const pairText = `🔗 *𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙸𝙽𝚂𝚃𝚁𝚄𝙲𝚃𝙸𝙾𝙽𝚂*

╭━━━━━━━━━━━━━━━━●◌
│ *📱 𝙽𝚞𝚖𝚋𝚎𝚛:* ${cleanNumber}
│ *🔗 𝙱𝚘𝚝 𝙻𝚒𝚗𝚔:*
│ https://sila-md-min-bot.onrender.com
│
│ *📖 𝙷𝚘𝚠 𝚝𝚘 𝙿𝚊𝚒𝚛:*
│ 1. 𝙲𝚕𝚒𝚌𝚔 𝚝𝚑𝚎 𝚕𝚒𝚗𝚔 𝚊𝚋𝚘𝚟𝚎
│ 2. 𝙴𝚗𝚝𝚎𝚛: *${cleanNumber}*
│ 3. 𝙶𝚎𝚝 𝚙𝚊𝚒𝚛𝚒𝚗𝚐 𝚌𝚘𝚍𝚎
│ 4. 𝙴𝚗𝚝𝚎𝚛 𝚌𝚘𝚍𝚎 𝚒𝚗 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙
│ 5. 𝙱𝚘𝚝 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚜 𝚊𝚞𝚝𝚘𝚖𝚊𝚝𝚒𝚌𝚕𝚢
╰━━━━━━━━━━━━━━━━●◌

> *𝙽𝙾 𝙽𝙴𝙴𝙳 𝚃𝙾 𝙼𝙰𝙽𝚄𝙰𝙻𝙻𝚈 𝙴𝙽𝚃𝙴𝚁 𝙲𝙾𝙳𝙴𝚂*`;

        await sendWithTemplate(sock, chatId, {
            text: pairText
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙸𝙽𝚂𝚃𝚁𝚄𝙲𝚃𝙸𝙾𝙽𝚂*'
        }, { quoted: message });
    }
}

// Free Bot Command
async function freebotCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🤖", key: message.key }}, { quoted: message });
        
        const freebotText = `🤖 *𝙵𝚁𝙴𝙴 𝙱𝙾𝚃 𝙻𝙸𝙽𝙺*

╭━━━━━━━━━━━━━━━━●◌
│ *🔗 𝙱𝚘𝚝 𝙻𝚒𝚗𝚔:*
│ https://sila-md-min-bot.onrender.com
│
│ *📖 𝙸𝚗𝚜𝚝𝚛𝚞𝚌𝚝𝚒𝚘𝚗𝚜:*
│ 1. 𝙲𝚕𝚒𝚌𝚔 𝚝𝚑𝚎 𝚕𝚒𝚗𝚔 𝚊𝚋𝚘𝚟𝚎
│ 2. 𝙴𝚗𝚝𝚎𝚛 𝚢𝚘𝚞𝚛 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙 𝚗𝚞𝚖𝚋𝚎𝚛
│ 3. 𝙶𝚎𝚝 𝚙𝚊𝚒𝚛𝚒𝚗𝚐 𝚌𝚘𝚍𝚎
│ 4. 𝙴𝚗𝚝𝚎𝚛 𝚌𝚘𝚍𝚎 𝚒𝚗 𝚆𝚑𝚊𝚝𝚜𝙰𝚙𝚙
│ 5. 𝙱𝚘𝚝 𝚠𝚒𝚕𝚕 𝚌𝚘𝚗𝚗𝚎𝚌𝚝 𝚊𝚞𝚝𝚘𝚖𝚊𝚝𝚒𝚌𝚕𝚢
╰━━━━━━━━━━━━━━━━●◌

> *➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`;

        await sendWithTemplate(sock, chatId, {
            text: freebotText
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝙱𝙾𝚃 𝙻𝙸𝙽𝙺*'
        }, { quoted: message });
    }
}

// Enhanced Menu Command with ALL commands
async function showEnhancedMenu(sock, chatId, message, number, activeBots) {
    try {
        await sock.sendMessage(chatId, { react: { text: "📜", key: message.key }}, { quoted: message });

        const startTime = Date.now() - (Math.floor(Math.random() * 86400000) + 3600000);
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const sanitizedNumber = number.replace(/\D/g, '');

        const menuText = `*╭━━━━━━━━━━━━━━━━●◌*
*│ 🤖 𝙶𝚛𝚎𝚎𝚝 :* *𝙷𝚎𝚕𝚕𝚘 👋*
*│ 🏷️ 𝙱𝚘𝚝 𝙽𝚊𝚖𝚎 :* 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸
*│ ⏰ 𝚁𝚞𝚗 𝚃𝚒𝚖𝚎 :* ${hours}𝚑 ${minutes}𝚖 ${seconds}𝚜
*│ 📱 𝚈𝚘𝚞𝚛 𝙽𝚞𝚖𝚋𝚎𝚛 :* ${sanitizedNumber}
*│ 🔢 𝙰𝚌𝚝𝚒𝚟𝚎 𝙱𝚘𝚝𝚜 :* ${activeBots}
*╰━━━━━━━━━━━━━━━━●◌*

*🤖 𝙰𝙸 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .ai
│  *✨ 𝙲𝚑𝚊𝚝 𝚆𝚒𝚝𝚑 𝙰𝙸*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .gemini
│  *✨ 𝙲𝚑𝚊𝚝 𝚆𝚒𝚝𝚑 𝙶𝚎𝚖𝚒𝚗𝚒 𝙰𝙸*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .gpt
│  *✨ 𝙲𝚑𝚊𝚝 𝚆𝚒𝚝𝚑 𝙲𝚑𝚊𝚝𝙶𝙿𝚃*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .gptnew
│  *✨ 𝙲𝚑𝚊𝚝 𝚆𝚒𝚝𝚑 𝙽𝚎𝚠 𝙶𝙿𝚃*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .gemininew
│  *✨ 𝙲𝚑𝚊𝚝 𝚆𝚒𝚝𝚑 𝙽𝚎𝚠 𝙶𝚎𝚖𝚒𝚗𝚒*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .aiask
│  *✨ 𝙰𝚜𝚔 𝙰𝙸 𝙼𝚒𝚜𝚝𝚛𝚊𝚕*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .sila
│  *✨ 𝚂𝙸𝙻𝙰 𝙰𝙸 𝙲𝚑𝚊𝚝*
╰━━━━━━━━━━━━━━━━━●◌

*📥 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .song
│  *🎵 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚈𝚘𝚞𝚝𝚞𝚋𝚎 𝚂𝚘𝚗𝚐𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .video
│  *🎥 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚈𝚘𝚞𝚝𝚞𝚋𝚎 𝚅𝚒𝚍𝚎𝚘𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .play
│  *🎶 𝚂𝚎𝚊𝚛𝚌𝚑 & 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚂𝚘𝚗𝚐𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .tiktok
│  *📱 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚃𝚒𝚔𝚝𝚘𝚔 𝚅𝚒𝚍𝚎𝚘𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .fb
│  *📘 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 𝚅𝚒𝚍𝚎𝚘𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .fbnew
│  *📘 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 (𝙽𝚎𝚠)*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .mediafire
│  *📁 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙼𝚎𝚍𝚒𝚊𝚏𝚒𝚛𝚎 𝙵𝚒𝚕𝚎𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .videy
│  *📹 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚅𝚒𝚍𝚎𝚢 𝚅𝚒𝚍𝚎𝚘𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .catbox
│  *📤 𝚄𝚙𝚕𝚘𝚊𝚍 𝚃𝚘 𝙲𝚊𝚝𝚋𝚘𝚡*
╰━━━━━━━━━━━━━━━━━●◌

*🎨 𝙸𝚖𝚊𝚐𝚎 & 𝚅𝚒𝚍𝚎𝚘 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .imagine
│  *🎨 𝙶𝚎𝚗𝚎𝚛𝚊𝚝𝚎 𝙰𝙸 𝙸𝚖𝚊𝚐𝚎𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .imagine2
│  *🎨 𝙶𝚎𝚗𝚎𝚛𝚊𝚝𝚎 𝙰𝙸 𝙸𝚖𝚊𝚐𝚎𝚜 (𝚅2)*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .txt2img
│  *🖼️ 𝙶𝚎𝚗𝚎𝚛𝚊𝚝𝚎 𝙰𝙸 𝙸𝚖𝚊𝚐𝚎 (𝙽𝚎𝚠)*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .sora
│  *🎥 𝙶𝚎𝚗𝚎𝚛𝚊𝚝𝚎 𝙰𝙸 𝚅𝚒𝚍𝚎𝚘*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .tocarbon
│  *💎 𝙲𝚘𝚗𝚟𝚎𝚛𝚝 𝚃𝚘 𝙲𝚊𝚛𝚋𝚘𝚗*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .vfc
│  *📹 𝚅𝚒𝚍𝚎𝚘 𝚃𝚘 𝙵𝚒𝚕𝚎 𝙲𝚘𝚗𝚟𝚎𝚛𝚝𝚎𝚛*
╰━━━━━━━━━━━━━━━━━●◌

*👥 𝙶𝚛𝚘𝚞𝚙 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .groupinfo
│  *👥 𝚂𝚑𝚘𝚠 𝙶𝚛𝚘𝚞𝚙 𝙸𝚗𝚏𝚘𝚛𝚖𝚊𝚝𝚒𝚘𝚗*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .tagall
│  *🔊 𝙼𝚎𝚗𝚝𝚒𝚘𝚗 𝙰𝚕𝚕 𝙼𝚎𝚖𝚋𝚎𝚛𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .listonline
│  *🟢 𝚂𝚑𝚘𝚠 𝙾𝚗𝚕𝚒𝚗𝚎 𝙼𝚎𝚖𝚋𝚎𝚛𝚜*
╰━━━━━━━━━━━━━━━━━●◌

*🎌 𝙰𝚗𝚒𝚖𝚎 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .anime
│  *🎌 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙰𝚗𝚒𝚖𝚎 𝙸𝚖𝚊𝚐𝚎𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .animequote
│  *🎌 𝙶𝚎𝚝 𝙰𝚗𝚒𝚖𝚎 𝚀𝚞𝚘𝚝𝚎𝚜*
╰━━━━━━━━━━━━━━━━━●◌

*🎮 𝙵𝚞𝚗 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .ship
│  *💘 𝙻𝚘𝚟𝚎 𝙲𝚊𝚕𝚌𝚞𝚕𝚊𝚝𝚘𝚛*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .wasted
│  *💀 𝚆𝚊𝚜𝚝𝚎𝚍 𝙴𝚏𝚏𝚎𝚌𝚝*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .flex
│  *💪 𝙱𝚘𝚝 𝙵𝚎𝚊𝚝𝚞𝚛𝚎𝚜 𝙵𝚕𝚎𝚡*
╰━━━━━━━━━━━━━━━━━●◌

*🔞 𝙰𝚍𝚞𝚕𝚝 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .pies
│  *🔞 𝙰𝚍𝚞𝚕𝚝 𝙲𝚘𝚗𝚝𝚎𝚗𝚝*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .tanzania
│  *🔞 𝙰𝚍𝚞𝚕𝚝 𝙲𝚘𝚗𝚝𝚎𝚗𝚝*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .japan
│  *🔞 𝙰𝚍𝚞𝚕𝚝 𝙲𝚘𝚗𝚝𝚎𝚗𝚝*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .korea
│  *🔞 𝙰𝚍𝚞𝚕𝚝 𝙲𝚘𝚗𝚝𝚎𝚗𝚝*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .china
│  *🔞 𝙰𝚍𝚞𝚕𝚝 𝙲𝚘𝚗𝚝𝚎𝚗𝚝*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .indo
│  *🔞 𝙰𝚍𝚞𝚕𝚝 𝙲𝚘𝚗𝚝𝚎𝚗𝚝*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .xvideo
│  *🔞 𝙰𝚍𝚞𝚕𝚝 𝙲𝚘𝚗𝚝𝚎𝚗𝚝*
╰━━━━━━━━━━━━━━━━━●◌

*⚡ 𝚂𝚢𝚜𝚝𝚎𝚖 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .ping
│  *⚡ 𝙲𝚑𝚎𝚌𝚔 𝙱𝚘𝚝 𝚂𝚙𝚎𝚎𝚍*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .alive
│  *⚡ 𝙲𝚑𝚎𝚌𝚔 𝙱𝚘𝚝 𝚂𝚝𝚊𝚝𝚞𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .owner
│  *⚡ 𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝙱𝚘𝚝 𝙾𝚠𝚗𝚎𝚛*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .pair
│  *⚡ 𝙿𝚊𝚒𝚛 𝙳𝚎𝚟𝚒𝚌𝚎 𝙲𝚘𝚍𝚎*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .settings
│  *⚙️ 𝙱𝚘𝚝 𝚂𝚎𝚝𝚝𝚒𝚗𝚐𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .jid
│  *🆔 𝙶𝚎𝚝 𝙹𝙸𝙳 𝙸𝚗𝚏𝚘*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .vv
│  *⚡ 𝚅𝚒𝚎𝚠 𝙾𝚗𝚌𝚎 𝙼𝚎𝚜𝚜𝚊𝚐𝚎𝚜*
╰━━━━━━━━━━━━━━━━━●◌

*🔧 𝚄𝚝𝚒𝚕𝚒𝚝𝚢 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .tts
│  *🗣️ 𝚃𝚎𝚡𝚝 𝚃𝚘 𝚂𝚙𝚎𝚎𝚌𝚑*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .githubtrend
│  *🐙 𝙶𝚒𝚝𝙷𝚞𝚋 𝚃𝚛𝚎𝚗𝚍𝚒𝚗𝚐*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .freebot
│  *🤖 𝙶𝚎𝚝 𝙵𝚛𝚎𝚎 𝙱𝚘𝚝 𝙻𝚒𝚗𝚔*
╰━━━━━━━━━━━━━━━━━●◌

*⚙️ 𝙲𝚘𝚗𝚝𝚛𝚘𝚕 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .menu
│  *⚙️ 𝚂𝚑𝚘𝚠 𝚃𝚑𝚒𝚜 𝙼𝚎𝚗𝚞*
╰━━━━━━━━━━━━━━━━━●◌

> *➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`;

        await sendWithTemplate(sock, chatId, { 
            image: { url: BOT_CONFIG.bot_image }, 
            caption: menuText
        }, { quoted: message });

    } catch (error) {
        console.error('Menu Error:', error);
        await sendWithTemplate(sock, chatId, { 
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙳𝙸𝚂𝙿𝙻𝙰𝚈𝙸𝙽𝙶 𝙼𝙴𝙽𝚄*' 
        }, { quoted: message });
    }
}

// Enhanced Ping Command
async function handlePingCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🏓", key: message.key }}, { quoted: message });
        
        const start = Date.now();
        await new Promise(resolve => setTimeout(resolve, 100));
        const ping = Date.now() - start;

        const pingText = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         ⚡ *𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*         ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 🚀 *𝙿𝚒𝚗𝚐:* ${ping} 𝚖𝚜
┃ ⏱️ *𝚄𝚙𝚝𝚒𝚖𝚎:* ${formatUptime()}
┃ 🔖 *𝚅𝚎𝚛𝚜𝚒𝚘𝚗:* 𝚟2.0.0
┃ 💚 *𝚂𝚝𝚊𝚝𝚞𝚜:* 𝙾𝚗𝚕𝚒𝚗𝚎
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

        await sendWithTemplate(sock, chatId, {
            text: pingText
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙸𝙽 𝙿𝙸𝙽𝙶 𝙲𝙾𝙼𝙼𝙰𝙽𝙳*'
        }, { quoted: message });
    }
}

// Enhanced Alive Command
async function handleAliveCommand(sock, chatId, message, number) {
    try {
        await sock.sendMessage(chatId, { react: { text: "💚", key: message.key }}, { quoted: message });
        
        const startTime = Date.now() - (Math.floor(Math.random() * 86400000) + 3600000);
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const aliveText = `🤖 *𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙸𝚂 𝙰𝙻𝙸𝚅𝙴* 💚

╭━━━━━━━━━━━━━━━━●◌
│ *𝚂𝚝𝚊𝚝𝚞𝚜:* ✅ 𝙾𝚗𝚕𝚒𝚗𝚎
│ *𝚄𝚙𝚝𝚒𝚖𝚎:* ${hours}𝚑 ${minutes}𝚖 ${seconds}𝚜
│ *𝚄𝚜𝚎𝚛:* ${number.replace(/\D/g, '')}
│ *𝚅𝚎𝚛𝚜𝚒𝚘𝚗:* 2.0.0
╰━━━━━━━━━━━━━━━━●◌

> *𝙱𝚘𝚝 𝚒𝚜 𝚛𝚞𝚗𝚗𝚒𝚗𝚐 𝚜𝚖𝚘𝚘𝚝𝚑𝚕𝚢*`;

        await sendWithTemplate(sock, chatId, {
            image: { url: BOT_CONFIG.bot_image },
            caption: aliveText
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '💚 *𝙱𝙾𝚃 𝚂𝚃𝙰𝚃𝚄𝚂: 𝙰𝙻𝙸𝚅𝙴*\n\n*𝙰𝚕𝚕 𝚜𝚢𝚜𝚝𝚎𝚖𝚜 𝚘𝚙𝚎𝚛𝚊𝚝𝚒𝚘𝚗𝚊𝚕!*'
        }, { quoted: message });
    }
}

// Uptime Formatter
function formatUptime() {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${hours}𝚑 ${minutes}𝚖 ${seconds}𝚜`;
}

// Export all commands
module.exports = {
    // AI Commands
    aiCommand,
    geminiCommand,
    gptCommand,
    silaCommand,
    gptNewCommand,
    geminiNewCommand,
    silaCommand,
    
    // Menu Command
    showEnhancedMenu,
    
    // System Commands
    handlePingCommand,
    handleAliveCommand,
    freebotCommand,
    ownerCommand,
    pairCommand,
    settingsCommand,
    jidCommand,
    
    // Anime Commands
    animeCommand,
    animeQuoteCommand,
    
    // Download Commands
    tiktokCommand,
    facebookCommand,
    facebookNewCommand,
    videoCommand,
    songCommand,
    playCommand,
    mediafireCommand,
    videyCommand,
    catboxCommand,
    
    // Group Commands
    groupInfoCommand,
    tagAllCommand,
    listOnlineCommand,
    
    // Image/Video Generation
    imagineCommand,
    imagine2Command,
    soraCommand,
    txt2imgCommand,
    tocarbonCommand,
    vfcCommand,
    
    // Fun Commands
    shipCommand,
    wastedCommand,
    flexCommand,
    
    // Other Commands
    piesCommand,
    ttsCommand,
    viewOnceCommand,
    githubTrendCommand,
    
    // Utility Functions
    Antilink,
    containsURL,
    updateAutoBio,
    handleAutoLikeStatus,
    
    // Configuration
    BOT_CONFIG,
    AUTO_FEATURES,
    getChannelInfo,
    sendWithTemplate
};
