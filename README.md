# Symphony Roomzilla Bot

A JavaScript bot to manage room creation and population using either:
  - Active Directory Group
  - CSV File
  - Email File (EML)

## Pre-requisite
The below are pre-requisites for installation:
  - CentOS 7+
  - Node Package Manager (npm)

## Installation

``` bash
  $ [sudo] npm install
```

## Usage
__Create Symphony chat room using Active Directory__
  - Create a new chat room populated with a group of users
``` bash
/create RoomName /group AD_GroupName
```

__Create Symphony chat room using a CSV file__
  - Drag and drop a CSV file of users you would like to create the room with.
  - Type the Room Name you would like to use and hit return.


__Create Symphony chat room using an EML file__
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

### Symphony Configuration
You will need to edit the below file so it includes API endpoint information for your own Pod environment.
``` bash
  src/config/config.json
```

Update the following to match your environment,
``` js
{
    "sessionAuthHost": "podDomain.symphony.com",
    "sessionAuthPort": 443,
    "keyAuthHost": "podDomain.symphony.com",
    "keyAuthPort": 443,
    "podHost": "podDomain.symphony.com",
    "podPort": 443,
    "agentHost": "podDomain.symphony.com",
    "agentPort": 443,
    "authType": "rsa",
    "botCertPath": "",
    "botCertName": "",
    "botCertPassword": "",
    "botPrivateKeyPath": "rsa/",
    "botPrivateKeyName": "rsa-private-key.pem",
    "botUsername": "bot.username",
    "botEmailAddress": "bot.username@example.com",
    "appCertPath": "",
    "appCertName": "",
    "appCertPassword": "",
    "proxyURL": "",
    "proxyUsername": "",
    "proxyPassword": "",
    "authTokenRefreshPeriod": "30"
}
```


Below is further information regarding each of the configuration values,

 | Value              | Description                                        |
 | ------------------ | -------------------------------------------------- |
 | keyAuthHost        | FQDN for your KeyManager Authentication Endpoint   |
 | sessionAuthHost    | FQDN for your Pod SessionAuthentication Endpoint   |
 | agentHost          | FQDN for your Agent Endpoint                       |
 | podHost            | FQDN of your Symphony Pod                          |
 | botPrivateKeyName  | File name for your RSA PrivateKey file             |
 | botPrivateKeyPath  | Location for RSA Private Key                       |
 | botUsername        | Service Account Username for your Bot              |
 | botEmailAddress    | Email Address for your Bot Service Account         |


### Active Directory Configuration
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

 | Value      | Description                                                |
 | ---------- | ---------------------------------------------------------- |
 | url        | FQDN or IP to connect to your Active Directory Server      |    
 | baseDN     | Directory base location for searching for users            |
 | username   | Name of the Active Directory account the bot will use      |
 | password   | Password for the Active Directory account the bot will use |
 | attributes | Active Directory fields that will be returned in searches  |

## Starting and Stopping the Bot
To start the bot application you can use the following command,
``` bash
  $ [sudo] npm start
```

To stop the bot application you use the following command,
``` bash
  $ [sudo] npm stop
```

## Message Templates
The following folder has the formatting and templates for response messages and reports for room creation.  You can modify this according to your requirements.
``` bash
  src/lib/template.js
```

## Room Member Limits
A configuration setting has been included in the below file to allow the administrator to set the maximum members that are allowed when creating a room.
``` bash
  src/api.js
```

The value you need to update is show here.  Update this to your preferred room size limit,
``` js
  let maxlimit = 100 // Maximum room members
```

# Release Notes
## 1.0.1
- Updated LICENCE information to be Apache 2.0 compliant.
- Updated Symphony Node SDK Client version to latest, 1.0.11
- Updated package.json to include latest versions of package dependencies.

## 1.0.0
- Initial Bot Release
