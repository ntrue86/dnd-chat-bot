import { Client, GatewayIntentBits, VoiceChannel, Message, TextChannel, NewsChannel } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { generateLlamaResponse } from './llama';
import { textToSpeech } from './tts';
import { saveMessage, loadContext } from './contextdb';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!DISCORD_TOKEN) {
  throw new Error('Missing DISCORD_TOKEN in environment variables.');
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates] });

// Configurable context message limit
const CONTEXT_MESSAGE_LIMIT = parseInt(process.env.CONTEXT_MESSAGE_LIMIT || '500', 10);

// Allowed channels configuration
const ALLOWED_TEXT_CHANNELS = (process.env.ALLOWED_TEXT_CHANNELS || '').split(',').map(s => s.trim()).filter(Boolean);
const ALLOWED_VOICE_CHANNELS = (process.env.ALLOWED_VOICE_CHANNELS || '').split(',').map(s => s.trim()).filter(Boolean);

// Initial prompt configuration
let INITIAL_PROMPT = process.env.INITIAL_PROMPT || '';
if (INITIAL_PROMPT.startsWith('(') && INITIAL_PROMPT.endsWith(')')) {
  // Remove parentheses and join lines if it's a multi-line string
  INITIAL_PROMPT = INITIAL_PROMPT.slice(1, -1).split(/"\s*"/).join(' ').replace(/(^"|"$)/g, '').replace(/\s+/g, ' ').trim();
}

client.on('messageCreate', async (message: Message) => {
  if (message.author.bot) return;

  // Reset command: !reset
  if (message.content.trim() === '!reset') {
    const channelId = message.channel.id;
    // Remove all messages for this channel from the context database
    const dbPath = path.join(__dirname, 'context.sqlite3');
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(dbPath);
    db.prepare('DELETE FROM messages WHERE channel_id = ?').run(channelId);
    // Seed the initial prompt if set
    if (INITIAL_PROMPT) {
      db.prepare('INSERT INTO messages (channel_id, role, content) VALUES (?, ?, ?)')
        .run(channelId, 'Bot', INITIAL_PROMPT);
    }
    db.close();
    await message.reply('Bot context has been reset for this channel.');
    return;
  }

  // Restrict to allowed text channels if configured
  if (ALLOWED_TEXT_CHANNELS.length && !ALLOWED_TEXT_CHANNELS.includes(message.channel.id)) return;

  const prompt = message.content.replace('!ask', '').trim();
  if (!prompt) return message.reply('Please provide a prompt.');

  const channelId = message.channel.id;
  const userLabel = `${message.author.username}:`;
  // Check if this is a new conversation (no context yet)
  let context = loadContext(channelId, CONTEXT_MESSAGE_LIMIT);
  if (context.length === 0 && INITIAL_PROMPT) {
    context.push(`Bot: ${INITIAL_PROMPT}`);
  }
  saveMessage(channelId, 'User', `${userLabel} ${prompt}`);
  context = loadContext(channelId, CONTEXT_MESSAGE_LIMIT);
  const fullPrompt = context.join('\n') + '\nBot:';

  if (message.channel instanceof TextChannel || message.channel instanceof NewsChannel) {
    await message.channel.sendTyping();
  }
  const reply = await generateLlamaResponse(fullPrompt);
  saveMessage(channelId, 'Bot', reply);
  // Discord message limit is 2000 chars per message, but we'll use 4000 as requested
  const MAX_DISCORD_MESSAGE_LENGTH = 4000;
  if (reply.length > MAX_DISCORD_MESSAGE_LENGTH) {
    for (let i = 0; i < reply.length; i += MAX_DISCORD_MESSAGE_LENGTH) {
      await message.reply(reply.slice(i, i + MAX_DISCORD_MESSAGE_LENGTH));
    }
  } else {
    await message.reply(reply);
  }

  // If user is in a voice channel, join and play TTS
  if (message.member?.voice.channel) {
    const voiceChannel = message.member.voice.channel as VoiceChannel;
    // Restrict to allowed voice channels if configured
    if (ALLOWED_VOICE_CHANNELS.length && !ALLOWED_VOICE_CHANNELS.includes(voiceChannel.id)) return;
    const ttsPath = path.join(__dirname, 'tts.mp3');
    await textToSpeech(reply, ttsPath);
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      const player = createAudioPlayer();
      const resource = createAudioResource(ttsPath);
      player.play(resource);
      connection.subscribe(player);
      player.once(AudioPlayerStatus.Idle, () => {
        connection.destroy();
        fs.unlinkSync(ttsPath);
      });
    } catch (err) {
      connection.destroy();
      if (fs.existsSync(ttsPath)) fs.unlinkSync(ttsPath);
    }
  }
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.login(DISCORD_TOKEN);
