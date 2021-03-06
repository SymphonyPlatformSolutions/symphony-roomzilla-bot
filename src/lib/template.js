var template = {}

// Help Message
template.help = `
<div><span class="tempo-text-color--theme-accent"><b>Create Symphony chat room using Active Directory</b></span>
  <ul>
  <li><b>/create</b> <i>RoomName</i> <b>/group</b> <i>AD Group</i> -- Create a new chat room populated with a group of users</li>
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
  <p><code>emailAddress,memberType\njohn@domain.com,owner\nanne@domain.com,\nvinay@domain.com,owner</code></p>
</div>`

// Response after room creation & No errors
template.activeDirectory = (roomName, members) => {
  return `
  <div><card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
  <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed Successfully</b></span></header>
    <body>
    <br></br>
    <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully.</p>\n\n
    <br></br>
    <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
    <p>We added <span class="tempo-text-color--theme-accent"><b>${members.length}</b></span> user(s) to the room.</p>
    </body>
  </card></div>`
}

// Response after room creation & Unknown Symphony Users & Malformed Emails
template.csvUnknownUser = (roomName, roomMemberCount, unknownUser) => {
  return `
  <div><card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
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
   </body>
  </card></div>`
}

// Response after room creation & Unknown Symphony Users
template.csvUknownAndBadUser = (roomName, roomMemberCount, unknownUser, csvUserBad) => {
  return `
  <div><card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
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
    </body>
  </card></div>`
}

// Response after room creation & Malformed Emails
template.csvBadUserAndMalformedUser = (roomName, roomMemberCount, csvUserBad) => {
  return `
  <div><card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
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
   </body>
  </card></div>`
}

// Response after room creation & No errors
template.csv = (roomName, csvUser) => {
  return `
  <div><card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
  <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed Successfully</b></span></header>
    <body>
    <br></br>
    <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully.</p>\n\n
    <br></br>
    <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
    <p>We added <span class="tempo-text-color--theme-accent"><b>${csvUser.length}</b></span> user(s) to the room.</p>
    </body>
  </card></div>`
}

// EML Response with CC
template.emlTemplateCc = (email, body) => {
  return `
  <div><card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/email_PNG37.png">
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
    </body>
  </card></div>`
}

// EML Response without CC
template.emlTemplate = (email, body) => {
  return `
  <div><card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/email_PNG37.png">
  <header><span class="tempo-text-color--theme-accent"><b>${email.subject}</b></span></header>
    <body>
    <br></br>
    <p><span class="tempo-text-color--theme-primary">From: ${email.headers.from.replace(/</g, '').replace(/>/g, '')}</span></p>\n\n
    <p><span class="tempo-text-color--theme-primary">To: ${email.headers.to.replace(/</g, '').replace(/>/g, '').replace(/,/g,' ')}</span></p>\n\n
    <br></br>
    <p><span class="tempo-text-color--theme-accent">On: ${email.headers.date.replace(/,/,' ')}</span></p>\n\n
    <br></br>
    <p>${body}</p>
    </body>
  </card></div>`
}

// Response after room creation & Unknown Symphony Users
template.emlUknownUser = (roomName, roomMemberCount, unknownUser) => {
  return `
  <div><card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
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
   </body>
  </card></div>`
}

// Response after room creation & Unknown Symphony Users
template.eml = (roomName, roomMemberCount) => {
  return `
  <div><card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
  <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed Successfully</b></span></header>
   <body>
   <br></br>
   <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully.</p>\n\n
   <br></br>
   <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
   <p>We added <span class="tempo-text-color--theme-accent"><b> ${roomMemberCount} </b></span> user(s) to the room.</p>\n\n
   <br></br>
   </body>
  </card></div>`
}

module.exports = template
