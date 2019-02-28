const Symphony = require('symphony-api-client-node')
// const config = require('./config/config')
const template = require('./lib/template')
const getUsersFromGroupName = require('./api/ldapAPI')
const atob = require('atob')
const csv = require('fast-csv')
const MailParser = require('mailparser-mit').MailParser

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
    messages.forEach(async (message, index) => {
      let userId = message.user.userId
      console.log('[DEBUG] UserId: ' + userId)
      let messageText = message.messageText
      console.log('[DEBUG] Message: ' + messageText)
      let messageId = message.messageId
      console.log('[DEBUG] MessageId: ' + messageId)
      let attachments = message.attachments
      console.log('[DEBUG] Attachments: ' + JSON.stringify(attachments))
      // let attachmentName = message.attachments.name
      // console.log('AttachmentName: ' + attachmentName)
      let streamId = message.stream.streamId
      console.log('[DEBUG] StreamId: ' + streamId)
      let streamType = message.stream.streamType
      console.log('[DEBUG] StreamType: ' + streamType)

      if ((messageText.match('/help')) && streamType === 'IM') {
        template.help = template.help.replace(/&/g, 'and')
        Symphony.sendMessage(streamId, template.help, null, Symphony.MESSAGEML_FORMAT)
      }
      // Room creation using Active Directory
      // RegEx to check if message is for Room Creation using AD then extract information
      else if (messageText.match(AdRegex) && streamType === 'IM') {
        var match = AdRegex.exec(messageText)
        console.log('[DEBUG] Room Name: ' + match[2])
        console.log('[DEBUG] AD Group Name: ' + match[4])
        var roomName = match[2]
        var groupName = match[4]

        if (roomName) {
          let roomId
          // Look up users from Active Directory Group
          try {
            const users = await getUsersFromGroupName(groupName)
            var members = JSON.parse(users)
            Symphony.sendMessage(streamId, 'Retrieved <b> ' + members.length + '</b> users from the Active Directory group <b>' + groupName + '</b>', null, Symphony.MESSAGEML_FORMAT)
          } catch (err) {
            Symphony.sendMessage(streamId, '<span class="tempo-text-color--red"><b>ERROR:</b> The Active Directory group <b>' + groupName + '</b> cannot be found, please check and correct this value.</span>', null, Symphony.MESSAGEML_FORMAT)
            return
          }
          // Create chat room
          if (members.length > 0) {
            try {
              Symphony.sendMessage(streamId, '<messageML>Attempting to create chat room <b>' + roomName + '</b></messageML>', null, Symphony.MESSAGEML_FORMAT)
              roomId = await Symphony.createRoom(roomName, 'Created by Roombot', [{
                'key': 'group',
                'value': groupName
              }], false, true, false, false, false, false, true)
            } catch (err) {
              console.log(err)
              Symphony.sendMessage(streamId, '<span class="tempo-text-color--red"><b>Error:</b> The name <b>' + roomName + '</b> is too similar to one that is already in use. Please choose another name.</span>', null, Symphony.MESSAGEML_FORMAT)
            }
            console.log('[DEBUG] New Room: ' + roomId.roomSystemInfo.id)

            // Promote bot initiator as owner of the room
            await Symphony.addMemberToRoom(roomId.roomSystemInfo.id, userId)
            await Symphony.promoteUserToOwner(roomId.roomSystemInfo.id, userId)

            // Loop through Active Directory Group users and them to the room
            try {
              for (var i = 0; i < members.length; i++) {
                var member = members[i]
                // Lookup userID from email value
                console.log('[DEBUG] Member Email: ', member.mail)
                const memberUserId = await Symphony.getUserFromEmail(member.mail)
                // Add userID to chat room
                console.log('[DEBUG] Member userId: ', memberUserId.id)
                await Symphony.addMemberToRoom(roomId.roomSystemInfo.id, memberUserId.id)
              }
              // Response after room creation & No errors
              // template.activeDirectory = template.activeDirectory.replace(/&/g, 'and')
              console.log('********* MessageML: ' + template.activeDirectory)
              Symphony.sendMessage(streamId, template.activeDirectory, null, Symphony.MESSAGEML_FORMAT)
              // Clear out Array
              members.length = 0
            } catch (err) {
              console.log('Error' + err)
              Symphony.sendMessage(streamId, '<span class="tempo-text-color--red"><b>ERROR:</b><b>' + err + '</span>', null, Symphony.MESSAGEML_FORMAT)
            }
          } else {
            console.log('Error: Empty Group')
            Symphony.sendMessage(streamId, '<span class="tempo-text-color--red"><b>ERROR:</b> Could not create room <b>' + roomName + '</b> as the Active Directory group  has no users.</span>', null, Symphony.MESSAGEML_FORMAT)
          }
        }
      }
      // Room creation using CSV File
      else if (attachments && attachments[0].name.match('csv') && streamType === 'IM') {
        let attachmentName = message.attachments.name
        console.log('Detected CSV file upload.  Creating room using CSV file.')
        let csvUser = []
        let csvUserBad = []

        // Retrieve CSV file attachment
        try {
          let file = await Symphony.getAttachment(streamId, attachments[0].id, messageId)
          file = atob(file)
          // Lets process the CSV file
          csv
            .fromString(file, {
              headers: true
            })
            .validate(function (data) {
              // Validate each row of CSV into an Array
              console.log('Validating emailAddress value: ' + data.emailAddress)
              if (emailRegex.test(data.emailAddress))
                return true
              else {
                return false
              }
            })
            .on('data', function (data) {
            // Add each row of CSV into an Array
              csvUser.push(data)
            })
            .on('data-invalid', function (data) {
            // Add each bad row of CSV into an Array
              csvUserBad.push(data.emailAddress)
              console.log('Bad CSV row: ' + data.emailAddress)
              // return
            })
            .on('end', async function () {
              console.log('Processed CSV File')

              // Create Room with name from message
              let roomName = message.messageText
              if (roomName && (csvUser.length > 0)) {
                let roomId
                try {
                  Symphony.sendMessage(streamId, 'Attempting to create chat room <b>' + roomName + '</b>', null, Symphony.MESSAGEML_FORMAT)
                  // create room
                  try {
                    console.log('RoomName: ' + roomName)
                    roomId = await Symphony.createRoom(roomName, 'Created by Roombot', [{
                      'key': 'roombot',
                      'value': 'csv'
                    }], false, true, false, false, false, false, true)
                    console.log(roomId)
                  } catch (err) {
                    console.log(err)
                    Symphony.sendMessage(streamId, '<span class="tempo-text-color--red"><b>ERROR:</b> The name <b>' + roomName + '</b> is too similar to one that is already in use. Please choose another name.</span>', null, Symphony.MESSAGEML_FORMAT)
                    return
                  }
                  // Promote bot initiator as owner of the room
                  await Symphony.addMemberToRoom(roomId.roomSystemInfo.id, userId)
                  await Symphony.promoteUserToOwner(roomId.roomSystemInfo.id, userId)

                  // Loop through CSV file users to obtain userID
                  let unknownUser = []
                  for (var i = 0; i < csvUser.length; i++) {
                    var csvmember = csvUser[i]

                    // Lookup userID from mail value
                    try {
                      console.log('Look up userId for: ' + csvmember.emailAddress)
                      const memberUserId = await Symphony.getUserFromEmailV3({
                        email: csvmember.emailAddress
                      })
                      // Add user to the chat room
                      if (memberUserId) {
                        await Symphony.addMemberToRoom(roomId.roomSystemInfo.id, memberUserId.id)
                        console.log('Symphony User has been added to the room: ' + memberUserId.id)

                        // Promote userID to chat room owner if required
                        if (csvmember.memberType === 'owner') {
                          await Symphony.promoteUserToOwner(roomId.roomSystemInfo.id, memberUserId.id)
                        } else {
                          console.log('User does not need to be promoted as room owner: ' + csvmember.emailAddress)
                        }
                      } else {
                      // Error adding user to the room
                        unknownUser.push(csvmember.emailAddress)
                        console.log('There was an error adding this user to the room: ' + csvmember.emailAddress)
                      }
                    } catch (err) {
                      console.log('Lookup failed for ' + csvmember.emailAddress + ' the user email value does not exist in Symphony.')
                      break
                    }
                  }
                  console.log('Unknown User count: ' + unknownUser.length)
                  console.log('Valid EmailAddress count: ' + csvUser.length)
                  console.log('Bad emailAddress count: ' + csvUserBad.length)

                  // Response after room creation & Unknown Symphony Users & Malformed Emails
                  if ((unknownUser.length > 0) && (csvUserBad.length > 0)) {
                    let roomMemberCount = csvUser.length - unknownUser.length
                    Symphony.sendMessage(streamId, roomName + roomMemberCount + unknownUser.length + csvUserBad.length, null, Symphony.MESSAGEML_FORMAT)

                  // Response after room creation & Unknown Symphony Users
                  } else if ((unknownUser.length > 0) && (csvUserBad.length <= 0)) {
                  // console.log(unknownUser.length)
                    let roomMemberCount = csvUser.length - unknownUser.length
                    Symphony.sendMessage(streamId, roomName + roomMemberCount + unknownUser.length, null, Symphony.MESSAGEML_FORMAT)

                  // Response after room creation & Malformed Emails
                  } else if ((unknownUser.length <= 0) && (csvUserBad.length > 0)) {
                    let roomMemberCount = csvUser.length - unknownUser.length
                    Symphony.sendMessage(streamId, roomName + roomMemberCount + csvUserBad.length, null, Symphony.MESSAGEML_FORMAT)
                  } else {
                    // Response after room creation & No errors
                    Symphony.sendMessage(streamId, roomName + csvUser.length, null, Symphony.MESSAGEML_FORMAT)
                  }
                  // Clear out Array
                  csvUser.length = 0
                  csvUserBad.length = 0
                  unknownUser.length = 0
                } catch (err) {
                // If we hit a failure condition when creating the chat room
                  Symphony.sendMessage(streamId, '<span class="tempo-text-color--red"><b>Error:</b> Could not create room <b>' + roomName + '</b><br></br>' + err.message + '</span>', null, Symphony.MESSAGEML_FORMAT)
                  console.log('There was an error creating the room.' + err)
                }
              }
            })
        } catch (err) {
          console.log(err)
          Symphony.sendMessage(streamId, '<span class="tempo-text-color--red"><b>Error:</b> There was an issue accessing the CSV file.  Please try again.<br></br>' + err.message + '</span></messageML>', null, Symphony.MESSAGEML_FORMAT)
        }
      }
      // Room creation using EML File
      else if (attachments && attachments[0].name.match('eml') && streamType === 'IM') {
        let attachmentName = message.attachments.name
        console.log('Detected EML file upload.  Creating room using EML file.')
        let emlMember = []

        // Retrieve EML file attachment
        try {
          let eml = await Symphony.getAttachment(streamId, attachments[0].id, messageId)
          eml = atob(eml)

          // Parse EML file
          var mailparser = new MailParser()
          mailparser.write(eml)
          mailparser.end()
          mailparser.on('end', async function (email) {
            console.log('Processed EML File')

            // Concatenate Email headers to obtain Email Addresses
            var headers = email.headers.from + ' ' + email.headers.to + ' ' + email.headers.cc
            console.log(headers)

            // Add email participants to Array
            var regex = /(<[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+>)/gi
            var match
            console.log('Running matches')
            while (match = regex.exec(headers)) {
              // Remove them horrible < > signs
              match[1] = match[1].replace(/</, '').replace(/>/, '')
              emlMember.push(match[1])
            }
            console.log('Members: ' + emlMember)

            let roomName = message
            console.log('EML Room Name: ' + roomName)

            // Lets start the magic with Email
            if (roomName && (emlMember.length > 0)) {
              let roomId
              try {
                Symphony.sendMessage(streamId, 'Attempting to create chat room <b>' + roomName + '</b>', null, Symphony.MESSAGEML_FORMAT)
                // create room
                try {
                  console.log('RoomName: ' + roomName)
                  roomId = await Symphony.createRoom(roomName, 'Created by Roombot', [{
                    'key': 'roombot',
                    'value': 'eml'
                  }], false, true, false, false, false, false, true)
                  console.log(roomId)
                } catch (err) {
                  console.log(err)
                  Symphony.sendMessage(streamId, '<span class="tempo-text-color--red"><b>Error:</b> The name <b>' + roomName + '</b> is too similar to one that is already in use. Please choose another name.</span></messageML>', null, Symphony.MESSAGEML_FORMAT)
                  return
                }
                // Promote bot initiator as owner of the room
                await Symphony.addMemberToRoom(roomId.roomSystemInfo.id, userId)
                await Symphony.promoteUserToOwner(roomId.roomSystemInfo.id, userId)

                // Define header variables for email and push email context into newly created room
                var body = email.text.replace(/</g, '').replace(/>/g, '').split(/\r\n|\r|\n/gm)

                if (email.headers.cc) {
                  Symphony.sendMessage(roomId.roomSystemInfo.id, 'eml file with cc', null, Symphony.MESSAGEML_FORMAT)
                } else {
                  Symphony.sendMessage(roomId.roomSystemInfo.id, 'eml file no cc', null, Symphony.MESSAGEML_FORMAT)
                }

                // Loop through EML file users to obtain userID
                let unknownUser = []
                for (var i = 0; i < emlMember.length; i++) {
                  var emailMember = emlMember[i]
                  // Lookup userID from mail value
                  try {
                    console.log('Look up userId for: ' + emailMember)
                    const memberUserId = await Symphony.getUserFromEmailV3({
                      email: emailMember
                    })
                    // Add user to the chat room
                    if (memberUserId) {
                      await Symphony.addMemberToRoom(roomId.roomSystemInfo.id, memberUserId.id)
                      console.log('Symphony User has been added to the room: ' + memberUserId.id)
                    } else {
                      // Error adding user to the room
                      unknownUser.push(emailMember)
                      console.log('There was an error adding this user to the room: ' + emailMember)
                    }
                  } catch (err) {
                    console.log('Lookup failed for ' + emailMember + ' the user email value does not exist in Symphony.')
                    break
                  }
                }
                console.log('Unknown User count: ' + unknownUser.length)
                console.log('Email Members count: ' + emlMember.length)

                // Response after room creation & Unknown Symphony Users & Malformed Emails
                let roomMemberCount = emlMember.length - unknownUser.length
                if (unknownUser.length > 0) {
                  Symphony.sendMessage(streamId, 'completed with errors - unknown & malformed users', null, Symphony.MESSAGEML_FORMAT)

                // Response after room creation & Unknown Symphony Users
                } else {
                  Symphony.sendMessage(streamId, 'completed with errors - unknown users', null, Symphony.MESSAGEML_FORMAT)
                }
                // Clear out Array
                emlMember.length = 0
                unknownUser.length = 0
              } catch (err) {
              // If we hit a failure condition when creating the chat room
                Symphony.sendMessage(streamId, '<span class="tempo-text-color--red"><b>Error:</b> Created the room <b>' + roomName + '</b> but there were errors adding the room members.<br></br>' + err.message + '</span>', null, Symphony.MESSAGEML_FORMAT)
                console.log('There was an error adding users to the room.' + err)
              }
            }
          })
        } catch (err) {
          console.log(err)
          Symphony.sendMessage(streamId, '<span class="tempo-text-color--red"><b>Error:</b> There was an issue accessing the EML file.  Please try again.<br></br>' + err.message + '</span>', null, Symphony.MESSAGEML_FORMAT)
        }
      }
    })
  }
}

module.exports = Api
