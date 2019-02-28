var template = {}

// Help Message
template.help = `
<span class="tempo-text-color--theme-accent"><b>Create Symphony chat room using Active Directory</b></span>
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
        <p><code>emailAddress,memberType\njohn@domain.com,owner\nanne@domain.com,\nvinay@domain.com,owner\n</code></p>`

// Active Directory - Success
template.activeDirectory = `
<card accent="tempo-bg-color--theme-accent" iconSrc="https://sup-lab.symphony.com/vinay/c4af4e637d41970201bd5de34142e942.png">
    <header><span class="tempo-text-color--theme-accent"><b>Room Provisioning Report - Completed Successfully</b></span></header>
    <body>
    <br></br>
    <p>Your room <span class="tempo-text-color--theme-accent"><b>${roomName}</b></span> was created successfully.</p>\n\n
    <br></br>
    <p><span class="tempo-text-color--theme-accent"><b>Room Members</b></span></p>
    <p>We added <span class="tempo-text-color--theme-accent"><b>${members.length}</b></span> user(s) to the room.</p>
    </body></card></div>`

module.exports = template
