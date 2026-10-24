const tmi = require('tmi.js');
require('dotenv').config();

let client = null;

function initializeTwitch() {
  if (!process.env.TWITCH_BOT_USERNAME || !process.env.TWITCH_OAUTH_TOKEN) {
    console.log('📺 Twitch: Credentials not configured (skipping)');
    return null;
  }

  client = new tmi.Client({
    options: { debug: false },
    identity: {
      username: process.env.TWITCH_BOT_USERNAME,
      password: process.env.TWITCH_OAUTH_TOKEN
    },
    channels: [process.env.TWITCH_CHANNEL || process.env.TWITCH_BOT_USERNAME]
  });

  client.connect().then(() => {
    console.log('📺 Twitch bridge connected');
  }).catch(err => {
    console.log('📺 Twitch: Connection failed (check credentials)');
  });

  client.on('message', (channel, tags, message, self) => {
    if (self) return;
    console.log(`📺 [${tags['display-name']}]: ${message}`);
  });

  return client;
}

function sendTwitchMessage(message) {
  if (!client) {
    console.log(`📺 Twitch (offline): ${message}`);
    return;
  }

  const channel = process.env.TWITCH_CHANNEL || process.env.TWITCH_BOT_USERNAME;
  client.say(channel, message)
    .then(() => console.log(`📺 Twitch sent: ${message}`))
    .catch(err => console.error('📺 Twitch send error:', err.message));
}

module.exports = {
  initializeTwitch,
  sendTwitchMessage
};
