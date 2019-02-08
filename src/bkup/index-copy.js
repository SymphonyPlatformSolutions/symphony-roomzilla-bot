// Import Api
const Api = require('./api')

// Libraries
const bodyParser = require('body-parser')
const express = require('express')

// Server Configuration
const app = express()
const PORT = process.env.PORT || 4001
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.listen(PORT, () => {
  console.log('*****************************')
  console.log('** Bot is Active with HTTP **')
  console.log('*****************************')
  Api.init()
})
