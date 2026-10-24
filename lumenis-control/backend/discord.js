const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

let client = null;

function initializeDiscord() {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.log('🎙 Discord: Token not configured (skipping)');
    return null;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.on('ready', () => {
    console.log(`🎙 Discord bridge connected as ${client.user.tag}`);
  });

  client.on('error', (error) => {
    console.error('🎙 Discord error:', error.message);
  });

  client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.log('🎙 Discord: Connection failed (check token)');
  });

  return client;
}

function sendRuntimeAlert(message) {
  if (!client || !client.isReady()) {
    console.log(`🎙 Discord (offline): ${message}`);
    return;
  }

  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!channelId) {
    console.log('🎙 Discord: Channel ID not configured');
    return;
  }

  const channel = client.channels.cache.get(channelId);
  if (channel) {
    channel.send(`🌌 **LUMENIS:** ${message}`)
      .then(() => console.log(`🎙 Discord sent: ${message}`))
      .catch(err => console.error('🎙 Discord send error:', err.message));
  }
}

module.exports = {
  initializeDiscord,
  sendRuntimeAlert
};
