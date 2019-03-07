const ActiveDirectory = require('activedirectory')
const Q = require('kew')

var config = {
  url: 'ldap://1.1.1.1',
  baseDN: 'cn=users,dc=testdomain,dc=net',
  username: 'Sync User',
  password: 'mypassword',
  attributes: {
    user: ['sAMAccountName', 'mail', 'displayName']
  }
}

var ad = new ActiveDirectory(config)

function getUsersForGroup (groupName) {
  var defer = Q.defer()
  ad.getUsersForGroup(groupName, function (err, users) {
    if (err) {
      console.log('ERROR: ' + JSON.stringify(err))
      return (err)
    }
    defer.resolve(JSON.stringify(users))
  })
  return defer.promise
}

module.exports = getUsersForGroup
