const fs = require('fs')
const config = require('../config/config')
const Symphony = require('symphony-api-client-node')

let api = ' '
//
// api.setCerts(fs.readFileSync(config.CERT_FILE_PATH, {encoding: 'utf-8'}), fs.readFileSync(config.CERT_KEY_FILE_PATH, {encoding: 'utf-8'}), config.CERT_PASSPHRASE)

module.exports = api
