# DnD Chat Bot

A Discord chat bot for Dungeons & Dragons (or any RPG), powered by Llama for LLM-based chat and OpenAI for text-to-speech (TTS). The bot keeps context, supports multi-user conversations, and can speak in voice channels with configurable style.

## Features
- Uses Llama (local) for chat responses
- Uses OpenAI TTS for voice responses in Discord voice channels
- Remembers conversation context per channel (configurable length, stored in SQLite)
- Multi-user support (tracks usernames in context)
- Restrict bot to specific text/voice channels
- Configurable initial prompt and TTS instructions

## Requirements
- Node.js 18+
- Python 3.x (for Llama model dependencies, if required)
- Discord bot token
- OpenAI API key
- Llama model file (e.g., `llama-model.bin`)

## Installation
1. Clone this repository.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your configuration:
   ```sh
   cp .env.example .env
   # Then edit .env with your values
   ```
4. Download your Llama model and place it in the project directory (or set the path in `.env`).
5. Start the bot:
   ```sh
   npx ts-node src/bot.ts
   ```

## Configuration (.env)

- `DISCORD_TOKEN` - Your Discord bot token
- `OPENAI_API_KEY` - Your OpenAI API key
- `LLAMA_MODEL_PATH` - Path to your Llama model file (e.g., `./llama-model.bin`)
- `CONTEXT_MESSAGE_LIMIT` - How many messages of context to keep per channel (default: 500)
- `ALLOWED_TEXT_CHANNELS` - Comma-separated list of Discord text channel IDs the bot will respond in (leave blank for all)
- `ALLOWED_VOICE_CHANNELS` - Comma-separated list of Discord voice channel IDs the bot will join for TTS (leave blank for all)
- `INITIAL_PROMPT` - The initial prompt/persona for the bot when a new conversation starts (e.g., "You are a helpful D&D assistant...")
- `OPENAI_TTS_INSTRUCTIONS` - Instructions for how the TTS should speak (e.g., "Speak with a dramatic, fantasy narrator tone.")

## Usage
- In a Discord text channel, type `!ask <your message>` to interact with the bot.
- If you are in a voice channel, the bot will join and speak its reply using TTS (if allowed by config).
- The bot will remember the last N messages (configurable) for context.

## Notes
- Make sure your bot has the necessary Discord permissions for reading messages, sending messages, and joining/speaking in voice channels.
- The bot uses SQLite for context storage (creates `context.sqlite3` in the project directory).
- For best results, use a high-quality Llama model and ensure your system meets its requirements.

## License
MIT
