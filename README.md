# Symphony Directory Backend

A simple javascript botkit starter template meant to be used as a base template to create chat bots on the Symphony platform.

## Requirements

- Idea of what you want the bot to do!
- Your own pod
- API Agent Library installed either on the cloud or on-premise
- A Service Account for the Bot that can be created in your pod's Admin Portal -- For this Directory project, a Service Account with User Provisioning access is required
- Security Certificates for Bot Authentication, with one of the certificate upload to the Admin Portal^
- Symphony REST API Documentation Access @ https://developers.symphony.com
- NodeJS/NPM installed. This is only tested to work on v7.10+

^ (certificates should be obtained from your internal PKI infrastructure, or refer to Certificate Generator for Windows PDF Instructions for more information)

## Instructions

1) Run `npm install` to install all the node modules dependencies.

2) Place your .pem and .p12 certificates in the /certs folder

3) In the config.js file, fill in your own pod and agent API library endpoints (POD_URL, AGENT_URL, AGENT_URL2, SESSION_ENDPOINT, KEY_MANAGER_ENDPOINT)

4) In the same config.js file, fill in the filepath to the appropriate certificate and certificate key as well as the certificate passphrase (CERT_FILE_PATH, CERT_KEY_FILE_PATH, CERT_PASSPHRASE)

5) Ensure the values in your `.env.example` file is updated. Then rename `.env.example` to `.env`

6) You may now run `npm start`. This runs the server that can be accessed on localhost:4000

7) The script will attempt to authenticate to your pod as well as your key manager to obtain both the pod session token as well as a key manager token.

8) You should be able to now search for your bot and chat with it either in an IM or CHATROOM! It should have an online status.

9) By default, the bot is filtering for `/hello` in your chat message which will render the `symphony-appkit` default compiled app. You can modify this and more in the `parseMessage` function in api.js

## Credits

Starterkit is created and maintained by Studios. It can be used and modified freely, with no expectation of any support whatsoever.
# symphony-roomzilla-bot
