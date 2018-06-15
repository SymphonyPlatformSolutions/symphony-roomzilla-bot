const rp = require('request-promise');
const config = require('./config/config');
const api = require('./symphony-api');
const moment = require('moment');
const getUsersFromGroupName = require('./api/ldapAPI');
const atob = require('atob');
const csv = require('fast-csv');
const MailParser = require("mailparser-mit").MailParser;
const fs = require('fs');
const RETRY_LIMIT = 5
const RETRY_TIMER_DELAY = [60000, 300000, 600000, 1800000, 3600000] //ms

let authenticated = false
let TempDataStore = {};
var emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/; // used for CSV parsing

let Api = {
        async kickstart(req, res) {
            try {
                if (!authenticated) {
                    await api.authenticate();
                    authenticated = true
                }

                config.me = await api.user.me();

                api.feed.start()

                api.feed.on('messages', (messages) => {
                    if (messages[0] !== undefined) {
                        if (messages[0].initiator.user.userId !== config.me.id) {
                            switch (messages[0].type) {
                                case 'MESSAGESENT':
                                    Api.parseMessage(messages)
                                    break
                                    case 'ROOMDEACTIVATED':
                                //default:
                                    break
                            }
                        }
                    }
                })

                api.feed.on('error', (error) => {
                    console.log('Error on feed: ', error)

                    api.feed.stop()

                    for (let i = 0; i < RETRY_LIMIT; i++) {
                        console.log('retry count is now: ', i)
                        console.log('retry timer is now: ', RETRY_TIMER_DELAY[i])

                        setTimeout(() => {
                            Api.kickstart()
                        }, RETRY_TIMER_DELAY[i])
                    }
                })
            } catch (err) {
                console.log(err)
            }
        },

        async parseMessage(data) {
            let userId = data[0].payload.messageSent.message.user.userId
            console.log('UserId: ' + userId)
            let message = data[0].payload.messageSent.message.message
            console.log('Message: ' + message)
            let messageId = data[0].payload.messageSent.message.messageId
            console.log('MessageId: ' + messageId)
            let attachments = data[0].payload.messageSent.message.attachments
            console.log(JSON.stringify(attachments))
            //let attachmentName = data[0].payload.messageSent.message.attachments.name
            //console.log('AttachmentName: ' + attachmentName)
            let streamId = data[0].payload.messageSent.message.stream.streamId
            console.log('Message: ' + streamId)
            let template = ''

            // Remove the XML tags to get the text typed
            message = message.replace('<div data-format="PresentationML" data-version="2.0" class="wysiwyg"><p>', '')
            message = message.replace('</p>', '')
            message = message.replace('</div>', '')
            console.log(message)

            var AdRegex = /(\/create)\s(.+)\s(\/group)\s(.+)/gi;

            if (message.match('/help')) {
                template = `<messageML><div>`
                template += `
          <span class="tempo-text-color--theme-accent"><b>Create Symphony chat room using Active Directory</b></span>
          <p><b>Note:</b> Please ensure you use the brackets to contain your RoomName and AD Group information.</p>
          <ul>
            <li><b>/create</b> <i>RoomName</i> <b>/group</b> <i>AD Group</i> -- Create a new chat room populated with a group of users</li>
            <li><b>/addusers</b> <i>AD Group</i> -- Add a group of users to an existing chatroom</li>
            <li><b>/removeusers</b> <i>AD Group</i> -- Remove a group of users to an existing chatroom</li>
          </ul>
          <br/>
          <span class="tempo-text-color--theme-accent"><b>Create Symphony chat room using a CSV file</b></span>
          <ol>
            <li>Drag and drop a CSV file of users you would like to create the room with.</li>
            <li>Type the Room Name you would like to use and hit return.</li>
          </ol>
          <br/>
          <span class="tempo-text-color--theme-accent"><b>Create Symphony chat room using an EML file</b></span>
          <ol>
            <li>Drag and drop an email with users you would like to create the room with.</li>
            <li>Type the Room Name you would like to use and hit return.</li>
          </ol>
          <br/>
          <p>Please ensure your CSV file is formatted correctly and ends with a .csv extension.  Below is an example template you can copy:</p>
          <p><code>emailAddress,memberType\njohn@domain.com,owner\nanne@domain.com,\nvinay@domain.com,owner\n</code></p>
        `
                template += '</div></messageML>'
                template = template.replace(/&/g, 'and')
                api.message.v4.send(streamId, template)
            }

            // Room creation using Active Directory
            // RegEx to check if message is for Room Creation using AD then extract information
            if (message.match(AdRegex)) {
                var match = AdRegex.exec(message);
                console.log('Room Name: ' + match[2]);
                console.log('AD Group Name: ' + match[4]);
                let roomName = match[2]
                let groupName = match[4]

                if (roomName) {
                    let roomID

                    // Look up users from Active Directory Group
                    try {
                        const users = await getUsersFromGroupName(groupName)
                        var members = JSON.parse(users)
                        api.message.v4.send(streamId, '<messageML>Retrieved <b> ' + members.length + '</b> users from the Active Directory group <b>' + groupName + '</b></messageML>')
                    } catch (err) {
                        api.message.v4.send(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> The Active Directory group <b>' + groupName + '</b> cannot be found, please check and correct this value.</span></messageML>')
                        return
                    }

                    // Create chat room
                    if (members.length > 0) {
                            try {
                                api.message.v4.send(streamId, '<messageML>Attempting to create chat room <b>' + roomName + '</b></messageML>')
                                roomID = await api.room.v3.create(roomName, "Created by Roombot", [{
                                    "key": "group",
                                    "value": groupName
                                }], false, true, false, false, false, false, true)
                                console.log(roomID)
                            } catch (err) {
                                console.log(err)
                                api.message.v4.send(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> The name <b>' + roomName + '</b> is too similar to one that is already in use. Please choose another name.</span></messageML>')
                                return
                            }

                            // Promote bot initiator as owner of the room
                            await api.room.addMember(roomID.roomSystemInfo.id, userId)
                            await api.room.promoteOwner(roomID.roomSystemInfo.id, userId)

                            // Loop through Active Directory Group users and them to the room
                            try {
                                for (var i = 0; i < members.length; i++) {
                                    var member = members[i];
                                    // Lookup userID from email value
                                    console.log(member.mail);
                                    const memberUserId = await api.user.lookup({
                                        email: member.mail
                                    })
                                    console.log(memberUserId.id)
                                    // Add userID to chat room
                                    await api.room.addMember(roomID.roomSystemInfo.id, memberUserId.id)
                                }

                                // Response after room creation & No errors
                                template = `<messageML><div>`
                                template += `
                          <card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
                          <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed Successfully</b></span></header>
                          <body>
                            <br></br>
                            <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully.</p>\n\n
                            <br></br>
                            <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
                            <p>We added <span class="tempo-text-color--theme-accent"><b>${members.length}</b></span> user(s) to the room.</p>
                        `
                                template += '</body></card></div></messageML>'
                                template = template.replace(/&/g, 'and')
                                api.message.v4.send(streamId, template)
                                //Clear out Array
                                members.length = 0;

                            } catch (err) {
                                console.log("Error" + err)
                                err = JSON.parse(err)
                                api.message.v4.send(streamId, `<messageML>${err.message}</messageML>`)
                                console.log(err)
                                return
                            }
                        }
                        else {
                            api.message.v4.send(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> Could not create room <b>' + roomName + '</b> as the Active Directory group  has no users.</span></messageML>')
                        }
                    }

                    // Room creation using CSV File
                    if (attachments && attachments[0].name.match("csv")) {
                        let attachmentName = data[0].payload.messageSent.message.attachments.name
                        console.log("Detected CSV file upload.  Creating room using CSV file.")
                        let csvUser = [];
                        let csvUserBad = [];

                        // Retrieve CSV file attachment
                        try {
                            let file = await api.message.v1.attachment(streamId, messageId, attachments[0].id)
                            file = atob(file)

                            //Lets process the CSV file
                            csv
                                .fromString(file, {
                                    headers: true
                                })
                                .validate(function(data) {
                                    //Validate each row of CSV into an Array
                                    console.log('Validating emailAddress value: ' + data.emailAddress);

                                    if (emailRegex.test(data.emailAddress))
                                        return true;
                                    else
                                        return false;
                                })
                                .on("data", function(data) {
                                    //Add each row of CSV into an Array
                                    csvUser.push(data);
                                })
                                .on("data-invalid", function(data) {
                                    //Add each bad row of CSV into an Array
                                    csvUserBad.push(data.emailAddress);
                                    console.log("Bad CSV row: " + data.emailAddress);
                                    return
                                })
                                .on("end", async function() {
                                    console.log("Processed CSV File");

                                    //Create Room with name from message
                                    let template = `<messageML><div>`
                                    let roomName = message
                                    if (roomName && (csvUser.length > 0)) {
                                        let roomID
                                        try {
                                            api.message.v4.send(streamId, '<messageML>Attempting to create chat room <b>' + roomName + '</b></messageML>')
                                            // create room
                                            try {
                                                console.log("RoomName: " + roomName)
                                                roomID = await api.room.v3.create(roomName, "Created by Roombot", [{
                                                    "key": "roombot",
                                                    "value": "csv"
                                                }], false, true, false, false, false, false, true)
                                                console.log(roomID)
                                            } catch (err) {
                                                console.log(err)
                                                api.message.v4.send(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> The name <b>' + roomName + '</b> is too similar to one that is already in use. Please choose another name.</span></messageML>')
                                                return
                                            }
                                            // Promote bot initiator as owner of the room
                                            await api.room.addMember(roomID.roomSystemInfo.id, userId)
                                            await api.room.promoteOwner(roomID.roomSystemInfo.id, userId)

                                            // Loop through CSV file users to obtain userID
                                            let unknownUser = [];
                                            for (var i = 0; i < csvUser.length; i++) {
                                                var csvmember = csvUser[i];

                                                // Lookup userID from mail value
                                                try {
                                                    console.log("Look up userId for: " + csvmember.emailAddress);
                                                    const memberUserId = await api.user.lookup({
                                                        email: csvmember.emailAddress
                                                    })
                                                    // Add user to the chat room
                                                    if (memberUserId) {
                                                        await api.room.addMember(roomID.roomSystemInfo.id, memberUserId.id)
                                                        console.log("Symphony User has been added to the room: " + memberUserId.id)

                                                        // Promote userID to chat room owner if required
                                                        if (csvmember.memberType === "owner") {
                                                            await api.room.promoteOwner(roomID.roomSystemInfo.id, memberUserId.id)
                                                        } else {
                                                            console.log("User does not need to be promoted as room owner: " + csvmember.emailAddress);
                                                        }
                                                    } else {
                                                        //Error adding user to the room
                                                        unknownUser.push(csvmember.emailAddress);
                                                        console.log("There was an error adding this user to the room: " + csvmember.emailAddress)
                                                        //console.log(unknownUser)
                                                    }
                                                } catch (err) {
                                                    console.log('Lookup failed for ' + csvmember.emailAddress + ' the user email value does not exist in Symphony.')
                                                    break;
                                                }
                                            }

                                            console.log('Unknown User count: ' + unknownUser.length)
                                            console.log('Valid EmailAddress count: ' + csvUser.length)
                                            console.log('Bad emailAddress count: ' + csvUserBad.length)

                                            // Response after room creation & Unknown Symphony Users & Malformed Emails
                                            if ((unknownUser.length > 0) && (csvUserBad.length > 0)) {
                                                let roomMemberCount = csvUser.length - unknownUser.length
                                                template = `<messageML><div>`
                                                template += `
                                        <card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
                                        <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed But with Errors</b></span></header>
                                        <body>
                                          <br></br>
                                          <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully however some of the users could not be added to the room.</p>\n\n
                                          <br></br>
                                          <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
                                          <p>We added <span class="tempo-text-color--theme-accent"><b> ${roomMemberCount} </b></span> user(s) to the room.</p>\n\n
                                          <br></br>
                                          <p><span class="tempo-text-color--theme-accent"><b>Unknown Users</b></span></p>
                                          <p>The following <span class="tempo-text-color--theme-accent"><b>${unknownUser.length}</b></span> user(s) were not added to the room.  It could be due to them not being enabled on Symphony, or not being enabled for External communications::</p>
                                          <p>${unknownUser.join('\r\n')}</p>
                                          <br></br>
                                          <p><span class="tempo-text-color--theme-accent"><b>Malformed Email Addresses</b></span></p>
                                          <p>The following <span class="tempo-text-color--theme-accent"><b>${csvUserBad.length}</b></span> email addresses are malformed:</p>
                                          <p>${csvUserBad.join('\r\n')}</p>
                                      `
                                                template += '</body></card></div></messageML>'
                                                template = template.replace(/&/g, 'and')
                                                api.message.v4.send(streamId, template)

                                                // Response after room creation & Unknown Symphony Users
                                            } else if ((unknownUser.length > 0) && (csvUserBad.length <= 0)) {
                                                console.log(unknownUser.length)
                                                let roomMemberCount = csvUser.length - unknownUser.length
                                                template = `<messageML><div>`
                                                template += `
                                              <card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
                                              <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed But with Errors</b></span></header>
                                              <body>
                                                <br></br>
                                                <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully however some of the users could not be added to the room.</p>\n\n
                                                <br></br>
                                                <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
                                                <p>We added <span class="tempo-text-color--theme-accent"><b> ${roomMemberCount} </b></span> user(s) to the room.</p>\n\n
                                                <br></br>
                                                <p><span class="tempo-text-color--theme-accent"><b>Unknown Users</b></span></p>
                                                <p>The following <span class="tempo-text-color--theme-accent"><b>${unknownUser.length}</b></span> user(s) were not added to the room.  It could be due to them not being enabled on Symphony, or not being enabled for External communications:</p>
                                                <p>${unknownUser.join('\r\n')}</p>
                                                <br></br>
                                            `
                                                template += '</body></card></div></messageML>'
                                                template = template.replace(/&/g, 'and')
                                                api.message.v4.send(streamId, template)

                                                // Response after room creation & Malformed Emails
                                            } else if ((unknownUser.length <= 0) && (csvUserBad.length > 0)) {
                                                let roomMemberCount = csvUser.length - unknownUser.length
                                                template = `<messageML><div>`
                                                template += `
                                                    <card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
                                                    <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed But with Errors</b></span></header>
                                                    <body>
                                                      <br></br>
                                                      <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully however some of the users could not be added to the room.</p>\n\n
                                                      <br></br>
                                                      <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
                                                      <p>We added <span class="tempo-text-color--theme-accent"><b> ${roomMemberCount} </b></span> user(s) to the room.</p>\n\n
                                                      <br></br>
                                                      <p><span class="tempo-text-color--theme-accent"><b>Malformed Email Addresses</b></span></p>
                                                      <p>The following <span class="tempo-text-color--theme-accent"><b>${csvUserBad.length}</b></span> email addresses are malformed:</p>
                                                      <p>${csvUserBad.join('\r\n')}</p>
                                                      <br></br>
                                                  `
                                                template += '</body></card></div></messageML>'
                                                template = template.replace(/&/g, 'and')
                                                api.message.v4.send(streamId, template)
                                            } else {
                                                // Response after room creation & No errors
                                                template = `<messageML><div>`
                                                template += `
                                      <card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
                                      <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed Successfully</b></span></header>
                                      <body>
                                        <br></br>
                                        <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully.</p>\n\n
                                        <br></br>
                                        <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
                                        <p>We added <span class="tempo-text-color--theme-accent"><b>${csvUser.length}</b></span> user(s) to the room.</p>
                                    `
                                                template += '</body></card></div></messageML>'
                                                template = template.replace(/&/g, 'and')
                                                api.message.v4.send(streamId, template)
                                            }
                                        } catch (err) {
                                            //If we hit a failure condition when creating the chat room
                                            api.message.v4.send(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> Could not create room <b>' + roomName + '</b><br></br>' + err.message + '</span></messageML>')
                                            console.log("There was an error creating the room.")
                                            console.log(err)
                                            return
                                        }
                                    }
                                    //Clear out Array
                                    // csvUser.length = 0;
                                    // csvUserBad.length = 0;
                                    // unknownUser.length = 0;
                                });
                        } catch (err) {
                            console.log(err)
                            api.message.v4.send(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> There was an issue accessing the CSV file.  Please try again.<br></br>' + err.message + '</span></messageML>')
                            return
                        }
                    }

                    // Room creation using EML File
                    if (attachments && attachments[0].name.match("eml")) {
                        let attachmentName = data[0].payload.messageSent.message.attachments.name
                        console.log("Detected EML file upload.  Creating room using EML file.")
                        let emlMember = [];
                        //let csvUserBad = [];

                        // Retrieve EML file attachment
                        try {
                            let eml = await api.message.v1.attachment(streamId, messageId, attachments[0].id)
                            eml = atob(eml)

                            // Read EML file
                            var mailparser = new MailParser();
                            mailparser.write(eml);
                            mailparser.end();
                            mailparser.on("end", async function(email) {
                                console.log("From :", email.headers.from);
                                console.log("To :", email.headers.to);
                                console.log("CC :", email.headers.cc);
                                console.log("Subject:", email.subject);
                                console.log("Text body:", email.text);

                                console.log("Processed EML File");

                                // Concatenate Email headers to obtain Email Addresses
                                var headers = email.headers.from + " " + email.headers.to + " " + email.headers.cc
                                console.log(headers)

                                // Add email participants to Array
                                var regex = /(<[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+>)/gi
                                var match;
                                console.log("running matches")
                                while (match = regex.exec(headers)) {

                                    // Remove them horrible < > signs
                                    match[1] = match[1].replace(/</, '').replace(/>/, '')
                                    emlMember.push(match[1]);
                                }
                                console.log("Members :" + emlMember)

                                let roomName = message
                                console.log("EML Room Name: " + roomName)

                                // Lets start the magic with Email
                                if (roomName && (emlMember.length > 0)) {
                                    let roomID
                                    try {
                                        api.message.v4.send(streamId, '<messageML>Attempting to create chat room <b>' + roomName + '</b></messageML>')
                                        // create room
                                        try {
                                            console.log("RoomName: " + roomName)
                                            roomID = await api.room.v3.create(roomName, "Created by Roombot", [{
                                                "key": "roombot",
                                                "value": "eml"
                                            }], false, true, false, false, false, false, true)
                                            console.log(roomID)
                                        } catch (err) {
                                            console.log(err)
                                            api.message.v4.send(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> The name <b>' + roomName + '</b> is too similar to one that is already in use. Please choose another name.</span></messageML>')
                                            return
                                        }
                                        // Promote bot initiator as owner of the room
                                        await api.room.addMember(roomID.roomSystemInfo.id, userId)
                                        await api.room.promoteOwner(roomID.roomSystemInfo.id, userId)

                                        // Define header variables for email and push email context into newly created room
                                        var body = email.text.replace(/</g, '').replace(/>/g, '').split(/\r\n|\r|\n/gm)

                                        if (email.headers.cc) {
                                            template = `<messageML><div>`
                                            template += `
                                  <card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/email_PNG37.png">
                                  <header><span class="tempo-text-color--theme-accent"><b>${email.subject}</b></span></header>
                                  <body>
                                    <br></br>
                                    <p><span class="tempo-text-color--theme-primary">From: ${email.headers.from.replace(/</g, '').replace(/>/g, '')}</span></p>\n\n
                                    <p><span class="tempo-text-color--theme-primary">To: ${email.headers.to.replace(/</g, '').replace(/>/g, '').replace(/,/g,' ')}</span></p>\n\n
                                    <p><span class="tempo-text-color--theme-primary">Cc: ${email.headers.cc.replace(/</g, '').replace(/>/g, '').replace(/,/g,' ')}</span></p>\n\n
                                    <br></br>
                                    <p><span class="tempo-text-color--theme-accent">On: ${email.headers.date.replace(/,/,' ')}</span></p>\n\n
                                    <br></br>
                                    <p>${body}</p>
                                `
                                            template += '</body></card></div></messageML>'
                                            template = template.replace(/&/g, 'and')
                                            template = template.replace(/,,/gm, '<br></br>')
                                            template = template.replace(/,/gm, '<p></p>')
                                            //console.log(template)
                                            api.message.v4.send(roomID.roomSystemInfo.id, template)

                                        } else {
                                            template = `<messageML><div>`
                                            template += `
                                  <card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/email_PNG37.png">
                                  <header><span class="tempo-text-color--theme-accent"><b>${email.subject}</b></span></header>
                                  <body>
                                    <br></br>
                                    <p><span class="tempo-text-color--theme-primary">From: ${email.headers.from.replace(/</g, '').replace(/>/g, '')}</span></p>\n\n
                                    <p><span class="tempo-text-color--theme-primary">To: ${email.headers.to.replace(/</g, '').replace(/>/g, '').replace(/,/g,' ')}</span></p>\n\n
                                    <br></br>
                                    <p><span class="tempo-text-color--theme-accent">On: ${email.headers.date.replace(/,/,' ')}</span></p>\n\n
                                    <br></br>
                                    <p>${body}</p>
                                `
                                            template += '</body></card></div></messageML>'
                                            template = template.replace(/&/g, 'and')
                                            template = template.replace(/,,/gm, '<br></br>')
                                            template = template.replace(/,/gm, '<p></p>')
                                            //console.log(template)
                                            api.message.v4.send(roomID.roomSystemInfo.id, template)
                                        }

                                        // Loop through EML file users to obtain userID
                                        let unknownUser = [];
                                        for (var i = 0; i < emlMember.length; i++) {
                                            var emailMember = emlMember[i];

                                            // Lookup userID from mail value
                                            try {
                                                console.log("Look up userId for: " + emailMember);
                                                const memberUserId = await api.user.lookup({
                                                    email: emailMember
                                                })
                                                // Add user to the chat room
                                                if (memberUserId) {
                                                    await api.room.addMember(roomID.roomSystemInfo.id, memberUserId.id)
                                                    console.log("Symphony User has been added to the room: " + memberUserId.id)
                                                } else {
                                                    //Error adding user to the room
                                                    unknownUser.push(emailMember);
                                                    console.log("There was an error adding this user to the room: " + emailMember)
                                                    //console.log(unknownUser)
                                                }
                                            } catch (err) {
                                                console.log('Lookup failed for ' + emailMember + ' the user email value does not exist in Symphony.')
                                                break;
                                            }
                                        }

                                        console.log('Unknown User count: ' + unknownUser.length)
                                        console.log('Email Members count: ' + emlMember.length)

                                        // Response after room creation & Unknown Symphony Users & Malformed Emails
                                        let roomMemberCount = emlMember.length - unknownUser.length
                                        if (unknownUser.length > 0) {
                                            template = `<messageML><div>`
                                            template += `
                                    <card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
                                    <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed With Errors</b></span></header>
                                    <body>
                                      <br></br>
                                      <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully however some of the users could not be added to the room.</p>\n\n
                                      <br></br>
                                      <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
                                      <p>We added <span class="tempo-text-color--theme-accent"><b> ${roomMemberCount} </b></span> user(s) to the room.</p>\n\n
                                      <br></br>
                                      <p><span class="tempo-text-color--theme-accent"><b>Unknown Users</b></span></p>
                                      <p>The following <span class="tempo-text-color--theme-accent"><b>${unknownUser.length}</b></span> user(s) were not added to the room.  It could be due to them not being enabled on Symphony, or not being enabled for External communications:</p>
                                      <p>${unknownUser.join('\r\n')}</p>
                                      <br></br>
                                  `
                                            template += '</body></card></div></messageML>'
                                            template = template.replace(/&/g, 'and')
                                            api.message.v4.send(streamId, template)

                                            // Response after room creation & Unknown Symphony Users
                                        } else {
                                            template = `<messageML><div>`
                                            template += `
                                      <card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
                                      <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed Successfully</b></span></header>
                                      <body>
                                        <br></br>
                                        <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully however some of the users could not be added to the room.</p>\n\n
                                        <br></br>
                                        <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
                                        <p>We added <span class="tempo-text-color--theme-accent"><b> ${roomMemberCount} </b></span> user(s) to the room.</p>\n\n
                                        <br></br>
                                    `
                                            template += '</body></card></div></messageML>'
                                            template = template.replace(/&/g, 'and')
                                            api.message.v4.send(streamId, template)
                                        }
                                    } catch (err) {
                                        //If we hit a failure condition when creating the chat room
                                        api.message.v4.send(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> Created the room <b>' + roomName + '</b> but there were errors adding the room members.<br></br>' + err.message + '</span></messageML>')
                                        console.log("There was an error adding users to the room.")
                                        console.log(err)
                                        return
                                    }
                                }
                            });
                        } catch (err) {
                            console.log(err)
                            api.message.v4.send(streamId, '<messageML><span class="tempo-text-color--red"><b>Error:</b> There was an issue accessing the EML file.  Please try again.<br></br>' + err.message + '</span></messageML>')
                            return
                        }
                        // //Clear out Array
                        // emlMember.length = 0;
                        // unknownUser.length = 0;
                    }
                  }
                },

                async heartBeat(req, res) {
                    console.log('heartbeat')
                    try {
                        console.log('heartbeat success')
                        await api.user.me()
                    } catch (err) {
                        console.log('heartbeat failed, restart feed?')
                        Api.kickstart()
                    }
                }
            }

module.exports = Api
