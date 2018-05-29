var ActiveDirectory = require('activedirectory');
var config = {
    url: 'ldap://52.212.185.168',
    baseDN: 'cn=users,dc=testdomain,dc=net',
    username: 'Sync User',
    password: 'Welcome123!',
    attributes: {
        user: ['sAMAccountName', 'mail', 'displayName'],
    },
}

var ldap = {};

var ad = new ActiveDirectory(config);

async function getUsersForGroup(groupName) {
    return new Promise(resolve => {
        ad.getUsersForGroup(groupName, function(err, users) {
            if (err) {
                console.log('ERROR: ' + JSON.stringify(err));
                return (err);
            }
            resolve(JSON.stringify(users))
        })
    });
}

module.exports = getUsersForGroup;
