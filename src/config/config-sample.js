let config = {
  urls: {
    keyUrl: 'https://sup-keyauth.symphony.com/keyauth',
    sessionUrl: 'https://sup-api.symphony.com/sessionauth',
    agentUrl: 'https://sup-agent.symphony.com/agent',
    podUrl: 'https://sup.symphony.com/pod'
  },

  tokens: {},

  CERT_FILE_PATH: './certs/bot.user1-cert.pem',
  CERT_KEY_FILE_PATH: './certs/bot.user1-key.pem',
  CERT_PASSPHRASE: 'mypassword',

  USERNAME: 'bot.user7',
  PASSWORD: 'mypassword',

  SESSION_TOKEN: '',
  KM_TOKEN: '',

  BOT_ID: '',
  STREAM_ID: ''
}

module.exports = config
