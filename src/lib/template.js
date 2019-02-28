var template = {}
let roomName

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
template.activeDirectory = `Room name ${roomName}`

module.exports = template
