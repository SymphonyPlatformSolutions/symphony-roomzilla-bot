require('dotenv').config()

const express = require('express')
const fs = require('fs')
const bodyParser = require('body-parser')
const Api = require('./api')
const http = require('http')
const https = require('https')
const config = require('./config/config')
const moment = require('moment')

let app = express()
let PORT = process.env.PORT || 4001

app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    next()
});

if (process.env.ENV !== 'dev') {
    https.createServer({
        cert: fs.readFileSync(config.CERT_FILE_PATH),
        key: fs.readFileSync(config.CERT_KEY_FILE_PATH),
        passphrase: config.CERT_PASSPHRASE
    }, app).listen(PORT, () => {
        console.log('******************************')
        console.log('** Bot is Active with HTTPS **')
        console.log('******************************')

        Api.kickstart()

        setInterval(() => {
            Api.heartBeat()
        }, 60000 * 5)
    })
} else {
    app.listen(PORT, () => {
        console.log('*********************************')
        console.log('** Bot is Active without HTTPS **')
        console.log('*********************************')

        Api.kickstart()

        setInterval(() => {
            Api.heartBeat()
        }, 60000 * 5)
    })
}
