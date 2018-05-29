let config = {
  urls: {
    keyUrl: 'https://sup-keyauth.symphony.com/keyauth',
    sessionUrl: 'https://sup-api.symphony.com/sessionauth',
    agentUrl: 'https://sup-agent.symphony.com/agent',
    podUrl: 'https://sup.symphony.com/pod'
  },

  tokens: {},

  CERT_FILE_PATH: './certs/bot.user7-cert.pem',
  CERT_KEY_FILE_PATH: './certs/bot.user7-key.pem',
  CERT_PASSPHRASE: 'Symphony123!',

  USERNAME: 'bot.user7',
  PASSWORD: 'Symphony123!',

  SESSION_TOKEN: '',
  KM_TOKEN: '',

  BOT_ID: '',
  STREAM_ID: ''
}

module.exports = config
