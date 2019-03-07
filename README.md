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
  src/config/config.js
```

Update the following to match your environment,
``` js
{
      "sessionAuthHost": "podDomain-api.symphony.com",
      "sessionAuthPort": 8444,
      "keyAuthHost": "podDomain.symphony.com",
      "keyAuthPort": 8444,
      "podHost": "podDomain.symphony.com",
      "podPort": 443,
      "agentHost": "podDomain.symphony.com",
      "agentPort": 443,
      "botCertPath": "PATH",
      "botCertName": "BOT-CERT-NAME",
      "botCertPassword": "BOT-PASSWORD",
      "botEmailAddress": "BOT-EMAIL-ADDRESS",
      "appCertPath": "",
      "appCertName": "",
      "appCertPassword": "",
      "proxyURL": "",
      "proxyUsername": "",
      "proxyPassword": ""
    }

```


Below is further information regarding each of the configuration values,

 | Value              | Description                                        |
 | ------------------ | -------------------------------------------------- |
 | keyAuthHost        | FQDN for your KeyManager Authentication Endpoint   |
 | sessionAuthHost    | FQDN for your Pod SessionAuthentication Endpoint   |
 | agentHost          | FQDN for your Agent Endpoint                       |
 | podHost            | FQDN of your Symphony Pod                          |
 | botCertName        | File name for your Certificate file                |
 | botCertPath        | Location for Certificate Private Key               |
 | botCertPassword    | Password to access your Certificate Private Key    |


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
