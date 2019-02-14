const Symphony = require('symphony-api-client-node')
// const config = require('./config/config')

const getUsersFromGroupName = require('./api/ldapAPI')
const atob = require('atob')
const csv = require('fast-csv')
const MailParser = require('mailparser-mit').MailParser

let authenticated = false
let TempDataStore = {}
var emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/ // used for CSV parsing
var AdRegex = /(\/create)\s(.+)\s(\/group)\s(.+)/gi

let Api = {
  async init () {
    Symphony.setDebugMode(true)
    Symphony.initBot(__dirname + '/config/config.json')
      .then((symAuth) => {
        Symphony.getDatafeedEventsService(Api.parseMessage)
      })
  },

  parseMessage (event, messages) {
    messages.forEach((message, index) => {
      let userId = message.user.userId
      console.log('[DEBUG] UserId: ' + userId)
      let messageText = message.messageText
      console.log('[DEBUG] Message: ' + messageText)
      let messageId = message.messageId
      console.log('[DEBUG] MessageId: ' + messageId)
      let attachments = message.attachments
      console.log('[DEBUG] Attachments: ' + JSON.stringify(attachments))
      let streamId = message.stream.streamId
      console.log('[DEBUG] StreamId: ' + streamId)
      let streamType = message.stream.streamType
      console.log('[DEBUG] StreamType: ' + streamType)

      if ((messageText.match('/help')) && streamType === 'IM') {
        Symphony.sendMessage(streamId, 'help', null, Symphony.MESSAGEML_FORMAT)
      } else if (messageText.match(AdRegex)) {
        var match = AdRegex.exec(messageText)
        console.log('[DEBUG] Room Name: ' + match[2])
        console.log('[DEBUG] AD Group Name: ' + match[4])
        let roomName = match[2]
        let groupName = match[4]
        if (roomName) {
          let roomID
          // Look up users from Active Directory Group
          try {
            console.log('[DEBUG] Retrieving Active Directory Users')
            getUsersFromGroupName(groupName).then((users) => {
              var members = JSON.parse(users)
              console.log('[DEBUG] Members: ', members.length)
              Symphony.sendMessage(streamId, 'Retrieved <b> ' + members.length + '</b> users from the Active Directory group <b>' + groupName + '</b>', null, Symphony.MESSAGEML_FORMAT)

              if (members.length > 0) {
                try {
                  Symphony.sendMessage(streamId, '<messageML>Attempting to create chat room <b>' + roomName + '</b></messageML>', null, Symphony.MESSAGEML_FORMAT)
                  console.log('[DEBUG] Room Name: ' + roomName)
                  Symphony.createRoom(roomName, 'Created by Roombot', [{ 'key': 'group', 'value': groupName }], false, true, false, false, false, false, true).then((roomId) => {
                    console.log('[DEBUG] New Room: ' + roomId.roomSystemInfo.id)
                    console.log('[DEBUG] Add User to Room: ' + userId)
                    Symphony.addMemberToRoom(roomId.roomSystemInfo.id, userId)
                    console.log('[DEBUG] Promote User to Room Owner')
                    Symphony.promoteUserToOwner(roomId.roomSystemInfo.id, userId)
                    // Loop through Active Directory Group users and them to the room
                    try {
                      for (var i = 0; i < members.length; i++) {
                        var member = members[i]
                        // Lookup userID from email value
                        console.log(member.mail)
                        Symphony.getUserFromEmail(member.mail).then((memberUserId) => {
                          console.log(memberUserId.id)
                          // Add userID to chat room
                          Symphony.addMemberToRoom(roomID.roomSystemInfo.id, memberUserId.id)
                        })
                      }
                      // Response after room creation & No errors
                      Symphony.sendMessage(streamId, 'wohoo', null, Symphony.PRESENTATION_FORMAT)
                      // Clear out Array
                      members.length = 0
                    } catch (err) {
                      console.log(err)
                    }
                  })
                } catch (err) {
                  console.log(err)
                  Symphony.sendMessage(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> The name <b>' + roomName + '</b> is too similar to one that is already in use. Please choose another name.</span></messageML>', null, Symphony.PRESENTATION_FORMAT)
                }
              } else {
                console.log('Error: Empty Group')
                Symphony.sendMessage(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> Could not create room <b>' + roomName + '</b> as the Active Directory group  has no users.</span></messageML>', null, Symphony.PRESENTATION_FORMAT)
              }
            })
          } catch (err) {
            console.log('Error: No such Group', err)
            Symphony.sendMessage(streamId, 'no group', null, Symphony.PRESENTATION_FORMAT)
          }
        }
      }
    })
  }
}

module.exports = Api
