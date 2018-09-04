# Symphony Roomzilla Bot

A JavaScript bot to manage room creation and population using either:
  - Active Directory Group
  - CSV File
  - Email File (EML)

## Installation

``` bash
  $ [sudo] npm install
```

## Usage
Create Symphony chat room using Active Directory
  - Create a new chat room populated with a group of users
``` bash
/create _RoomName_ /group _AD Group_
```
  - Add a group of users to an existing chatroom
``` bash
/addusers AD Group
```
  - Remove a group of users to an existing chatroom
``` bash
/removeusers AD Group
```
Create Symphony chat room using a CSV file
  - Drag and drop a CSV file of users you would like to create the room with.
  - Type the Room Name you would like to use and hit return.

Create Symphony chat room using an EML file
  - Drag and drop an email with users you would like to create the room with.
  - Type the Room Name you would like to use and hit return.

Please ensure your CSV file is formatted correctly and ends with a .csv extension. Below is an example template you can copy:
``` bash
  emailAddress,memberType
  john@domain.com,owner
  anne@domain.com,
  vinay@domain.com,owner
```

## Configuration
Before launching the bot you will need to configure the following files for your own environment.

**Symphony Configuration**
You will need to edit the below file so it includes API endpoint information for your own Pod environment.
  src/config/config.js

Update the following to match your environment,
``` js
  let config = {
    urls: {
      keyUrl: 'https://mypod.symphony.com/keyauth',
      sessionUrl: 'https://mypod.symphony.com/sessionauth',
      agentUrl: 'https://mypod.symphony.com/agent',
      podUrl: 'https://mypod.symphony.com/pod'
    },

    tokens: {},

    CERT_FILE_PATH: './certs/bot.user1-cert.pem',
    CERT_KEY_FILE_PATH: './certs/bot.user1-key.pem',
    CERT_PASSPHRASE: 'mypassword',

    USERNAME: 'bot.user1',
    PASSWORD: 'mypassword',

    SESSION_TOKEN: '',
    KM_TOKEN: '',

    BOT_ID: '',
    STREAM_ID: ''
  }

  module.exports = config
```

Below is further information regarding each of the configuration values,
Value              | Description                                        |
------------------ | -------------------------------------------------- |
keyUrl             | FQDN for your KeyManager Authentication Endpoint   |
sessionUrl         | FQDN for your Pod SessionAuthentication Endpoint   |
agentUrl           | FQDN for your Agent Endpoint                       |
podUrl             | FQDN of your Symphony Pod                          |
CERT_FILE_PATH     | File name and location for your Certificate file   |
CERT_KEY_FILE_PATH | File name and location for Certificate Private Key |
CERT_PASSPHRASE    | Password to access your Certificate Private Key    |
USERNAME           | Symphony Service Account login name for the bot    |
PASSWORD           | _this field is not in use_

**Active Directory Configuration**
You will need to create an Active Directory user account with read access to your LDAP directory.  This is so the bot can search for users and groups when creating rooms.  Please edit the below configuration file so it has the correct credentials,
``` bash
  src/api/ldapAPI.js
```

Update the following to match your environment,
``` js
  var ActiveDirectory = require('activedirectory');
  var config = {
      url: 'ldap://1.1.1.1',
      baseDN: 'cn=users,dc=testdomain,dc=net',
      username: 'Sync User',
      password: 'mypassword',
      attributes: {
          user: ['sAMAccountName', 'mail', 'displayName'],
      },
  }
```

Below is further information regarding each of the configuration values,
Value      | Description                                                |
---------- | ---------------------------------------------------------- |
url        | FQDN or IP to connect to your Active Directory Server      |    
baseDN     | Directory base location for searching for users            |
username   | Name of the Active Directory account the bot will use      |
password   | Password for the Active Directory account the bot will use |
attributes | Active Directory fields that will be returned in searches  |

**Starting and Stopping the Bot**
To start the bot application you can use the following command,
``` bash
  $ [sudo] npm start
```

To stop the bot application you use the following command,
``` bash
  $ [sudo] npm stop
```
