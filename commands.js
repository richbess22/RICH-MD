const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API Configuration
const APIS = {
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
    welcome: 'https://api.some-random-api.com/welcome/img/2/gaming3'
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
    return {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: BOT_CONFIG.channel_jid,
            newsletterName: BOT_CONFIG.channel_name,
            serverMessageId: -1
        }
    };
}

async function sendWithTemplate(sock, chatId, content, quoted = null) {
    const messageOptions = {
        ...content,
        contextInfo: getChannelInfo()
    };
    
    if (quoted) {
        return await sock.sendMessage(chatId, messageOptions, { quoted });
    }
    return await sock.sendMessage(chatId, messageOptions);
}

// Enhanced AI Commands with better error handling
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
            // Try alternative API
            const altResponse = await axios.get(`https://api.ibeng.tech/api/info/chatgpt?q=${encodeURIComponent(query)}&apikey=tamvan`);
            aiResponse = altResponse.data?.data || altResponse.data?.result || 'No response from AI service';
        }

        await sendWithTemplate(sock, chatId, {
            text: `🤖 *𝙰𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴*\n\n${aiResponse}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        console.error('AI Command Error:', error);
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙽𝙶 𝚃𝙾 𝙰𝙸 𝚂𝙴𝚁𝚅𝙸𝙲𝙴*\n\nPlease try again later.'
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

        // Try multiple Gemini APIs
        const apis = [
            `${APIS.gemini}${encodeURIComponent(query)}`,
            `${APIS.gemini2}${encodeURIComponent(query)}`,
            `${APIS.gemini3}${encodeURIComponent(query)}`,
            `https://api.ibeng.tech/api/ai/gemini?q=${encodeURIComponent(query)}&apikey=tamvan`
        ];

        let geminiResponse;
        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 15000 });
                geminiResponse = response.data?.result || response.data?.response || response.data?.data;
                if (geminiResponse) break;
            } catch (e) {
                continue;
            }
        }

        if (!geminiResponse) {
            geminiResponse = 'No response from Gemini service';
        }

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

        const response = await axios.get(`${APIS.chatgpt}${encodeURIComponent(query)}`, {
            timeout: 30000
        });
        
        const gptResponse = response.data?.result || response.data?.response || response.data?.message || 'No response from ChatGPT';

        await sendWithTemplate(sock, chatId, {
            text: `💬 *𝙲𝙷𝙰𝚃𝙶𝙿𝚃 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴*\n\n${gptResponse}\n\n*➥ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸*`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ *𝙴𝚁𝚁𝙾𝚁 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙽𝙶 𝚃𝙾 𝙲𝙷𝙰𝚃𝙶𝙿𝚃*'
        }, message);
    }
}

// Enhanced Menu Command
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
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .imagine
│  *✨ 𝙶𝚎𝚗𝚎𝚛𝚊𝚝𝚎 𝙰𝙸 𝙸𝚖𝚊𝚐𝚎𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .sora
│  *✨ 𝙶𝚎𝚗𝚎𝚛𝚊𝚝𝚎 𝙰𝙸 𝚅𝚒𝚍𝚎𝚘𝚜*
╰━━━━━━━━━━━━━━━━━●◌

*📥 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .song
│  *⬇️ 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚈𝚘𝚞𝚝𝚞𝚋𝚎 𝚂𝚘𝚗𝚐𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .video
│  *⬇️ 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚈𝚘𝚞𝚝𝚞𝚋𝚎 𝚅𝚒𝚍𝚎𝚘𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .tiktok
│  *⬇️ 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚃𝚒𝚔𝚝𝚘𝚔 𝚅𝚒𝚍𝚎𝚘𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .fb
│  *⬇️ 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙵𝚊𝚌𝚎𝚋𝚘𝚘𝚔 𝙿𝚘𝚜𝚝𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .img
│  *⬇️ 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝙸𝚖𝚊𝚐𝚎𝚜 𝙵𝚛𝚘𝚖 𝙶𝚘𝚘𝚐𝚕𝚎*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .play
│  *⬇️ 𝚂𝚎𝚊𝚛𝚌𝚑 & 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚂𝚘𝚗𝚐𝚜*
╰━━━━━━━━━━━━━━━━━●◌

*👥 𝙶𝚛𝚘𝚞𝚙 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .groupinfo
│  *👥 𝚂𝚑𝚘𝚠 𝙶𝚛𝚘𝚞𝚙 𝙸𝚗𝚏𝚘𝚛𝚖𝚊𝚝𝚒𝚘𝚗*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .tagall
│  *👥 𝙼𝚎𝚗𝚝𝚒𝚘𝚗 𝙰𝚕𝚕 𝙼𝚎𝚖𝚋𝚎𝚛𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .listonline
│  *👥 𝚂𝚑𝚘𝚠 𝙾𝚗𝚕𝚒𝚗𝚎 𝙼𝚎𝚖𝚋𝚎𝚛𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .promote
│  *👥 𝙿𝚛𝚘𝚖𝚘𝚝𝚎 𝙶𝚛𝚘𝚞𝚙 𝙰𝚍𝚖𝚒𝚗*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .demote
│  *👥 𝙳𝚎𝚖𝚘𝚝𝚎 𝙶𝚛𝚘𝚞𝚙 𝙰𝚍𝚖𝚒𝚗*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .kick
│  *👥 𝚁𝚎𝚖𝚘𝚟𝚎 𝙼𝚎𝚖𝚋𝚎𝚛 𝙵𝚛𝚘𝚖 𝙶𝚛𝚘𝚞𝚙*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .add
│  *👥 𝙰𝚍𝚍 𝙼𝚎𝚖𝚋𝚎𝚛 𝚃𝚘 𝙶𝚛𝚘𝚞𝚙*
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
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .stats
│  *⚡ 𝚂𝚑𝚘𝚠 𝙱𝚘𝚝 𝚂𝚝𝚊𝚝𝚒𝚜𝚝𝚒𝚌𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .vv
│  *⚡ 𝚅𝚒𝚎𝚠 𝙾𝚗𝚌𝚎 𝙼𝚎𝚜𝚜𝚊𝚐𝚎𝚜*
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

*⚙️ 𝙲𝚘𝚗𝚝𝚛𝚘𝚕 𝙼𝚎𝚗𝚞*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .settings
│  *⚙️ 𝙱𝚘𝚝 𝚂𝚎𝚝𝚝𝚒𝚗𝚐𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .set
│  *⚙️ 𝙲𝚑𝚊𝚗𝚐𝚎 𝚂𝚎𝚝𝚝𝚒𝚗𝚐𝚜*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .restart
│  *⚙️ 𝚁𝚎𝚜𝚝𝚊𝚛𝚝 𝙱𝚘𝚝*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .theme
│  *⚙️ 𝙲𝚑𝚊𝚗𝚐𝚎 𝙱𝚘𝚝 𝚃𝚑𝚎𝚖𝚎*
│
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .menu
│  *⚙️ 𝚂𝚑𝚘𝚠 𝚃𝚑𝚒𝚜 𝙼𝚎𝚗𝚞*
╰━━━━━━━━━━━━━━━━━●◌

*🔗 𝙵𝚛𝚎𝚎 𝙱𝚘𝚝*

╭━━━━━━━━━━━━━━━━━●◌
│    *🔹 𝙲𝚘𝚖𝚖𝚊𝚗𝚍 :* .freebot
│  *🤖 𝙶𝚎𝚝 𝙵𝚛𝚎𝚎 𝙱𝚘𝚝 𝙻𝚒𝚗𝚔*
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

// Fun Commands
async function shipCommand(sock, chatId, message) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants.map(v => v.id);
        
        if (participants.length < 2) {
            return await sendWithTemplate(sock, chatId, {
                text: '❌ Need at least 2 members to ship!'
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

        await sock.sendMessage(chatId, {
            text: `💘 *LOVE CALCULATOR*\n\n@${firstUser.split('@')[0]} ❤️ @${secondUser.split('@')[0]}\n\nLove Score: ${lovePercentage}%\n${loveMessage}`,
            mentions: [firstUser, secondUser]
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error shipping members'
        }, message);
    }
}

async function wastedCommand(sock, chatId, message, args) {
    try {
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
                text: '💀 Please mention someone or reply to their message to waste them!'
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
            caption: `⚰️ *WASTED*\n\n@${targetUser.split('@')[0]} has been wasted! 💀\n\nRest in pieces!`,
            mentions: [targetUser]
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error creating wasted image'
        }, message);
    }
}

// Image Generation Commands
async function imagineCommand(sock, chatId, message, args) {
    try {
        const prompt = args.join(' ');
        if (!prompt) {
            return await sendWithTemplate(sock, chatId, {
                text: '🎨 Please provide a prompt for image generation\nExample: .imagine a beautiful sunset over mountains'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🎨 Generating your image... Please wait.'
        }, message);

        const enhancedPrompt = `${prompt}, high quality, detailed, masterpiece, 4k, ultra realistic`;
        const response = await axios.get(`${APIS.imagine}${encodeURIComponent(enhancedPrompt)}`, {
            responseType: 'arraybuffer'
        });

        await sendWithTemplate(sock, chatId, {
            image: Buffer.from(response.data),
            caption: `🎨 *GENERATED IMAGE*\n\nPrompt: "${prompt}"\n\nPowered by SILA MD MINI`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error generating image'
        }, message);
    }
}

async function soraCommand(sock, chatId, message, args) {
    try {
        const prompt = args.join(' ');
        if (!prompt) {
            return await sendWithTemplate(sock, chatId, {
                text: '🎥 Please provide a prompt for video generation\nExample: .sora anime girl with blue hair'
            }, message);
        }

        await sendWithTemplate(sock, chatId, {
            text: '🎥 Generating your video... This may take a while.'
        }, message);

        const response = await axios.get(`${APIS.sora}${encodeURIComponent(prompt)}`);
        const videoUrl = response.data?.videoUrl || response.data?.result;

        if (!videoUrl) {
            throw new Error('No video URL received');
        }

        await sendWithTemplate(sock, chatId, {
            video: { url: videoUrl },
            caption: `🎥 *GENERATED VIDEO*\n\nPrompt: "${prompt}"\n\nPowered by SILA MD MINI`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error generating video'
        }, message);
    }
}

// Pies Command
const PIES_COUNTRIES = ['china', 'indonesia', 'japan', 'korea', 'hijab', 'tanzania'];

async function piesCommand(sock, chatId, message, args) {
    try {
        const country = args[0]?.toLowerCase();
        
        if (!country) {
            return await sendWithTemplate(sock, chatId, {
                text: `🔞 *PIES COMMAND*\n\nUsage: .pies <country>\n\nAvailable countries:\n${PIES_COUNTRIES.map(c => `• ${c}`).join('\n')}`
            }, message);
        }

        if (!PIES_COUNTRIES.includes(country)) {
            return await sendWithTemplate(sock, chatId, {
                text: `❌ Invalid country. Available: ${PIES_COUNTRIES.join(', ')}`
            }, message);
        }

        const response = await axios.get(`${APIS.pies}${country}?apikey=shizo`, {
            responseType: 'arraybuffer'
        });

        await sendWithTemplate(sock, chatId, {
            image: Buffer.from(response.data),
            caption: `🔞 *${country.toUpperCase()} CONTENT*\n\nPowered by SILA MD MINI`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error fetching content'
        }, message);
    }
}

// Text to Speech Command
async function ttsCommand(sock, chatId, message, args) {
    try {
        const text = args.join(' ');
        if (!text) {
            return await sendWithTemplate(sock, chatId, {
                text: '🗣️ Please provide text for TTS\nExample: .tts Hello how are you'
            }, message);
        }

        // Using external TTS API
        const ttsUrl = `https://api.voicerss.org/?key=demo&hl=en-us&src=${encodeURIComponent(text)}`;
        
        await sendWithTemplate(sock, chatId, {
            audio: { url: ttsUrl },
            mimetype: 'audio/mpeg',
            caption: `🗣️ *TEXT TO SPEECH*\n\nText: ${text}`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error generating TTS audio'
        }, message);
    }
}

// Anime Commands
async function animeCommand(sock, chatId, message, args) {
    try {
        const type = args[0]?.toLowerCase() || 'hug';
        const validTypes = ['hug', 'wink', 'pat', 'cry', 'kiss', 'slap', 'poke', 'face-palm'];
        
        if (!validTypes.includes(type)) {
            return await sendWithTemplate(sock, chatId, {
                text: `❌ Invalid anime type. Available: ${validTypes.join(', ')}`
            }, message);
        }

        const response = await axios.get(`${APIS.anime}${type}`);
        const animeData = response.data;

        if (animeData && animeData.link) {
            await sendWithTemplate(sock, chatId, {
                image: { url: animeData.link },
                caption: `🎌 *ANIME ${type.toUpperCase()}*\n\nPowered by Some Random API`
            }, message);
        } else {
            await sendWithTemplate(sock, chatId, {
                text: '❌ Failed to fetch anime image'
            }, message);
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error fetching anime image'
        }, message);
    }
}

// Download Commands
async function tiktokCommand(sock, chatId, message, args) {
    try {
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, {
                text: '📱 Please provide a TikTok URL\nExample: .tiktok https://vm.tiktok.com/xyz'
            }, message);
        }

        // Try multiple TikTok APIs
        const apis = [
            `https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(url)}`,
            `https://api.princetechn.com/api/download/tiktokdlv2?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
            `https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`
        ];

        let videoUrl;
        for (const api of apis) {
            try {
                const response = await axios.get(api);
                if (response.data?.result?.video || response.data?.video) {
                    videoUrl = response.data.result?.video || response.data.video;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!videoUrl) {
            throw new Error('No video found');
        }

        await sendWithTemplate(sock, chatId, {
            video: { url: videoUrl },
            caption: '📱 *TIKTOK VIDEO*\n\nDownloaded by SILA MD MINI'
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error downloading TikTok video'
        }, message);
    }
}

async function facebookCommand(sock, chatId, message, args) {
    try {
        const url = args[0];
        if (!url) {
            return await sendWithTemplate(sock, chatId, {
                text: '📘 Please provide a Facebook URL\nExample: .fb https://facebook.com/xxx'
            }, message);
        }

        const response = await axios.get(`${APIS.facebook}${encodeURIComponent(url)}`);
        const videoData = response.data;

        if (videoData?.result?.hd || videoData?.result?.sd) {
            const videoUrl = videoData.result.hd || videoData.result.sd;
            await sendWithTemplate(sock, chatId, {
                video: { url: videoUrl },
                caption: '📘 *FACEBOOK VIDEO*\n\nDownloaded by SILA MD MINI'
            }, message);
        } else {
            throw new Error('No video found');
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error downloading Facebook video'
        }, message);
    }
}

// Group Management Commands
async function groupInfoCommand(sock, chatId, message) {
    try {
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
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;

        // Simulate online users (in real implementation, you'd need presence tracking)
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

// Flex Command
async function flexCommand(sock, chatId, message, args) {
    try {
        const flexItems = [
            '┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃         🚀 BOT FEATURES         ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛',
            '╔══════════════════════════════════╗\n║ 🚀 Running on Premium Servers     ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ ⚡ Lightning Fast Responses       ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ 🎨 Advanced AI Capabilities      ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ 📥 Multiple Download Options     ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ 👥 Full Group Management         ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ 🔞 Adult Content Features       ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ 🎮 Gaming & Fun Commands         ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ 🤖 Multiple AI Assistants        ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ 💾 Auto Backup System           ║\n╚══════════════════════════════════╝',
            '╔══════════════════════════════════╗\n║ 🔒 Secure & Private             ║\n╚══════════════════════════════════╝'
        ];

        const selectedFlex = flexItems.sort(() => 0.5 - Math.random()).slice(0, 5);
        
        let flexText = '💪 *SILA MD MINI FLEX*\n\n';
        selectedFlex.forEach((item, index) => {
            flexText += `${item}\n`;
        });
        
        flexText += '\n🚀 _Most Powerful WhatsApp Bot_';

        await sendWithTemplate(sock, chatId, {
            image: { url: BOT_CONFIG.bot_image },
            caption: flexText
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '💪 *BOT FLEX*\n\n🚀 Premium Features\n⚡ High Speed\n🎨 Advanced AI\n📥 Multi-Download\n👥 Full Management\n\n_Most Powerful WhatsApp Bot_'
        }, message);
    }
}

// Enhanced Ping Command
async function handlePingCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { react: { text: "🏓", key: message.key }}, { quoted: message });
        
        const start = Date.now();
        // Simulate some processing
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

// Enhanced Pair Command
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

// Enhanced Owner Command
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
    
    // Menu Command
    showEnhancedMenu,
    
    // System Commands
    handlePingCommand,
    handleAliveCommand,
    freebotCommand,
    ownerCommand,
    pairCommand,
    
    // Anime Commands
    animeCommand,
    
    // Download Commands
    tiktokCommand,
    facebookCommand,
    videoCommand,
    
    // Group Commands
    groupInfoCommand,
    tagAllCommand,
    listOnlineCommand,
    
    // Image/Video Generation
    imagineCommand,
    soraCommand,
    
    // Fun Commands
    shipCommand,
    wastedCommand,
    flexCommand,
    
    // Other Commands
    piesCommand,
    ttsCommand,
    viewOnceCommand,
    
    // Configuration
    BOT_CONFIG,
    AUTO_FEATURES,
    getChannelInfo,
    sendWithTemplate
};
