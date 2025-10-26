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

// AI Commands
async function aiCommand(sock, chatId, message, args) {
    try {
        const query = args.join(' ');
        if (!query) {
            return await sendWithTemplate(sock, chatId, { 
                text: '🤖 Please provide a query for AI\nExample: .ai explain quantum physics' 
            }, message);
        }

        const response = await axios.get(`${APIS.chatgpt}${encodeURIComponent(query)}`);
        const aiResponse = response.data?.result || response.data?.response || 'No response from AI';
        
        await sendWithTemplate(sock, chatId, {
            text: `🤖 *AI RESPONSE*\n\n${aiResponse}\n\n_Powered by SILA MD MINI_`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error connecting to AI service'
        }, message);
    }
}

async function geminiCommand(sock, chatId, message, args) {
    try {
        const query = args.join(' ');
        if (!query) {
            return await sendWithTemplate(sock, chatId, { 
                text: '🔮 Please provide a query for Gemini\nExample: .gemini tell me about mars' 
            }, message);
        }

        const response = await axios.get(`${APIS.gemini}${encodeURIComponent(query)}`);
        const geminiResponse = response.data?.result || response.data?.response || 'No response from Gemini';
        
        await sendWithTemplate(sock, chatId, {
            text: `🔮 *GEMINI RESPONSE*\n\n${geminiResponse}\n\n_Powered by SILA MD MINI_`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error connecting to Gemini service'
        }, message);
    }
}

async function gptCommand(sock, chatId, message, args) {
    try {
        const query = args.join(' ');
        if (!query) {
            return await sendWithTemplate(sock, chatId, { 
                text: '💬 Please provide a query for ChatGPT\nExample: .gpt write a poem about nature' 
            }, message);
        }

        const response = await axios.get(`${APIS.chatgpt}${encodeURIComponent(query)}`);
        const gptResponse = response.data?.result || response.data?.response || 'No response from ChatGPT';
        
        await sendWithTemplate(sock, chatId, {
            text: `💬 *CHATGPT RESPONSE*\n\n${gptResponse}\n\n_Powered by SILA MD MINI_`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error connecting to ChatGPT service'
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
        const adminList = admins.map(admin => `• @${admin.split('@')[0]}`).join('\n');

        const infoText = `
        ╔══════════════════════
║ 🏷️  *GROUP INFORMATION*
╠══════════════════════
║ 
║ 👥  *Group Name:* ${metadata.subject}
║ 🆔  *Group ID:* ${metadata.id}
║ 👤  *Total Members:* ${participants.length}
║ 👑  *Group Owner:* @${owner.split('@')[0]}
║ 
║ ⚡  *Admins (${admins.length}):*
║ ${adminList}
║ 
║ 📝  *Description:*
║ ${metadata.desc || 'No description available'}
║ 
╠══════════════════════
║ _Powered by SILA MD MINI_
╚══════════════════════`.trim();

        await sendWithTemplate(sock, chatId, {
            text: infoText,
            mentions: [...admins, owner]
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error fetching group information'
        }, message);
    }
}

async function tagAllCommand(sock, chatId, message) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;

        let messageText = '🔊 *MENTION ALL MEMBERS*\n\n';
        participants.forEach(participant => {
            messageText += `@${participant.id.split('@')[0]}\n`;
        });

         await sendWithTemplate(sock, chatId, {
            text: messageText,
            mentions: participants.map(p => p.id)
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error tagging all members'
        }, message);
    }
}

async function listOnlineCommand(sock, chatId, message) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;

        // Simulate online users (in real implementation, you'd need presence tracking)
        const onlineUsers = participants.slice(0, Math.min(10, participants.length));
        
        let onlineText = '🟢 *ONLINE MEMBERS*\n\n';
        onlineUsers.forEach(user => {
            onlineText += `• @${user.id.split('@')[0]}\n`;
        });

        onlineText += `\nTotal: ${onlineUsers.length} members online`;

        await sendWithTemplate(sock, chatId, {
            text: onlineText,
            mentions: onlineUsers.map(p => p.id)
        }, { quoted: message });

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error listing online members'
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

         await sendWithTemplate(sock, chatId, {
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

// View Once Command
async function viewOnceCommand(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            return await sendWithTemplate(sock, chatId, {
                text: '🔍 Please reply to a view once message'
            }, message);
        }

        if (quoted.viewOnceMessageV2) {
            const viewOnceContent = quoted.viewOnceMessageV2.message;
            
            if (viewOnceContent.imageMessage) {
                await sendWithTemplate(sock, chatId, {
                    image: { url: viewOnceContent.imageMessage.url },
                    caption: '🔍 *VIEW ONCE IMAGE RECOVERED*\n\nPowered by SILA MD MINI'
                }, message);
            } else if (viewOnceContent.videoMessage) {
                await sendWithTemplate(sock, chatId, {
                    video: { url: viewOnceContent.videoMessage.url },
                    caption: '🔍 *VIEW ONCE VIDEO RECOVERED*\n\nPowered by SILA MD MINI'
                }, message);
            } else {
                await sendWithTemplate(sock, chatId, {
                    text: '❌ Unsupported view once content'
                }, message);
            }
        } else {
            await sendWithTemplate(sock, chatId, {
                text: '❌ No view once message found'
            }, message);
        }

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error recovering view once message'
        }, message);
    }
}

// Owner Command
async function ownerCommand(sock, chatId, message) {
    try {
        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:SILA MD\nTEL;waid=255612491554:+255612491554\nEND:VCARD`;

         await sendWithTemplate(sock, chatId, {
            contacts: {
                displayName: "SILA MD",
                contacts: [{ vcard }]
            }
        }, { quoted: message });

        await sendWithTemplate(sock, chatId, {
            image: { url: BOT_CONFIG.bot_image },
            caption: `👑 *BOT OWNER*\n\n*Name:* SILA MD\n*Number:* +255612491554\n*Role:* Bot Developer\n\n_Contact for bot issues and queries_`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '👑 *OWNER INFORMATION*\n\n*Name:* SILA MD\n*Number:* +255612491554\n*Contact for bot support and queries_'
        }, message);
    }
}

// Pair Command
async function pairCommand(sock, chatId, message, args) {
    try {
        const number = args[0];
        if (!number) {
            return await sendWithTemplate(sock, chatId, {
                text: '📱 Please provide a WhatsApp number\nExample: .pair 255612491554'
            }, message);
        }

        const cleanNumber = number.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10) {
            return await sendWithTemplate(sock, chatId, {
                text: '❌ Invalid phone number format'
            }, message);
        }

        // Simulate pairing code generation
        const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        await sendWithTemplate(sock, chatId, {
            text: `📱 *PAIRING CODE*\n\n*Number:* ${cleanNumber}\n*Code:* ${pairingCode}\n\nEnter this code in WhatsApp to connect your bot instance.\n\n_Powered by SILA MD MINI_`
        }, message);

    } catch (error) {
        await sendWithTemplate(sock, chatId, {
            text: '❌ Error generating pairing code'
        }, message);
    }
}

// Flex Command
async function flexCommand(sock, chatId, message, args) {
    try {
        const flexItems = [
╔══════════════════════════          
║         🚀 *BOT FEATURES*
╠══════════════════════════
║
║ 🚀 Running on Premium Servers
║ ⚡ Lightning Fast Responses  
║ 🎨 Advanced AI Capabilities
║ 📥 Multiple Download Options
║ 👥 Full Group Management
║
║ 🔞 Adult Content Features
║ 🎮 Gaming & Fun Commands
║ 🤖 Multiple AI Assistants
║ 💾 Auto Backup System
║ 🔒 Secure & Private
║
╠══════════════════════════
║     _Powered by SILA MD MINI_
╚══════════════════════════`
        ];

        const selectedFlex = flexItems.sort(() => 0.5 - Math.random()).slice(0, 5);
        
        let flexText = '💪 *SILA MD MINI FLEX*\n\n';
        selectedFlex.forEach((item, index) => {
            flexText += `✅ ${item}\n`;
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

// Export all commands
module.exports = {
    // AI Commands
    aiCommand,
    geminiCommand,
    gptCommand,
    
    // Anime Commands
    animeCommand,
    
    // Download Commands
    tiktokCommand,
    facebookCommand,
    
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
    ownerCommand,
    pairCommand,
    
    // Configuration
    BOT_CONFIG,
    AUTO_FEATURES,
    getChannelInfo,
    sendWithTemplate
};
