
const TimedEvent = require('./timedevent');
const DiscordExt = require( './discordext' );
const StrExt = require( './strext' );

class Raffle extends TimedEvent
{
    /**
     *
     */
    constructor()
    {
        // Call the parent constructor
        super();

        // Initialize the members list
        this.members = new Array();
    }

    /**
     * 
     */
    async start( interaction, endTime)
    {
        // Defer the reply because this is going to take a while
        await interaction.deferReply();

        // Get the current time/date
        let now = new Date();

        // Get the time that today started
        let dayTime = new Date( now );
        dayTime.setMilliseconds(0);
        dayTime.setSeconds(0);
        dayTime.setMinutes(0);
        dayTime.setHours(0);

        // Get all text channels
        let allChannels = await interaction.guild.channels.fetch();
        let channels = allChannels.filter(c => c.isText() );

        // Need to get all members who have posted today
        let postUserIds = new Set();
        for ( let channel of channels.values() )
        {
            // Get all messages from today
            let messages = await DiscordExt.getMessagesSince( channel, dayTime );

            // Add all users that posted today
            for ( let user of messages.map( m => m.author.id ) )
            {
                postUserIds.add( user );
            }
        }

        // Get all members in the guild
        let allMembers = await interaction.guild.members.fetch();
        allMembers = Array.from( allMembers.values() );

        // Get the toaster (bot) role
        let toasterRole = DiscordExt.getRole( interaction, 'Toaster' );

        // Get all non-bot members
        let realMembers = allMembers.filter( m => !m.roles.cache.some( r => r.id === toasterRole.id ) );

        // Get members who posted recently
        let postMembers = realMembers.filter( m => postUserIds.has( m.user.id ) );

        // Create the response
        let resp = '';
        resp += 'Raffle time! ' + StrExt.randomDogNoise();
        resp += '\nThis raffle will end at ' + endTime.toLocaleTimeString() + '!';
        resp += '\nReact to this message to enter!';
        //resp += "This is a test raffle! Don't bother responding to it because it's not a real raffle! ";
        //resp += endTime.toLocaleTimeString() + '!'; 

        if ( postMembers )
        {
            let names = postMembers.map( m => DiscordExt.getName( m ) );
            resp += '\n' + StrExt.oxfordComma(names) + " posted today! I'll put them in the raffle!";
        }

        // Add the members who recently posted to the raffle
        for ( let member of postMembers )
        {
            this.addMember( member );
        }

        // Reply to the user
        let message = await interaction.followUp( resp );

        // Activate
        this.activate( message, endTime );
    }

    /**
     *
     */
    async run()
    {
        // Choose a random member
        let index = Math.floor( Math.random() * this.members.length );

        // Choose the winner
        let winner = this.members[index];

        // Announce the raffle
        let memberNames = this.members.map( m => DiscordExt.getName( m ) );
        let resp = StrExt.randomDogNoise() + ' Running a raffle with ' + StrExt.oxfordComma( memberNames ) + '!';
        await this.message.reply( resp );

        // Announce the winner
        let winnerName = DiscordExt.getName( winner );
        resp = winnerName + ' wins! ' + StrExt.randomDogNoise() + ' ' + StrExt.randomDogNoise();
        //resp = winnerName + "doesn't win anything because this isn't a real raffle!";
        await this.message.reply( resp );
    }

    /**
     *
     */
    async onReaction( reaction, user )
    {
        this.addUser( user );
    }

    /**
     *
     */
    addMember( member )
    {
        if ( !this.members.some( m => m.user.id == member.user.id ))
        {
            this.members.push( member );
            console.log( 'Added ' + DiscordExt.getName( member ) + ' to the ongoing raffle' );
        }
        else
        {
            console.log( DiscordExt.getName( member ) + ' is already in the raffle' );
        }
    }

    /**
     *
     */
    async addUser( user )
    {
        // Get all members in the guild
        let allMembers = await this.message.guild.members.fetch();
        allMembers = Array.from( allMembers.values() );

        // Get the member from the user
        let member = allMembers.find( m => m.user.id == user.id );

        // Add the new member
        this.addMember( member );
    }
}
module.exports = Raffle;
