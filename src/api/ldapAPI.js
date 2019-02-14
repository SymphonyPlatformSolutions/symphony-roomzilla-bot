const ActiveDirectory = require('activedirectory')
const Q = require('kew')

var config = {
    url: 'ldap://52.212.185.168',
    baseDN: 'cn=users,dc=testdomain,dc=net',
    username: 'Sync User',
    password: 'Welcome123!',
    attributes: {
        user: ['sAMAccountName', 'mail', 'displayName'],
    },
}

var ad = new ActiveDirectory(config);

function getUsersForGroup(groupName) {
    var defer = Q.defer()
    ad.getUsersForGroup(groupName, function(err, users) {
        if (err) {
            console.log('ERROR: ' + JSON.stringify(err));
            return (err);
        }
        defer.resolve(JSON.stringify(users))
        console.log('Users :', users)
    })
    return defer.promise
}

module.exports = getUsersForGroup;
