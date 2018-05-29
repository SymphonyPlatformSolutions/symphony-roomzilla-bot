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
