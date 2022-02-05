
//-------
// Setup
//-------
const { token } = require( './config.json' );
const Discord = require( 'discord.js' );
const { subcommands } = require( './deploy-commands.js' );

// Initialize Discord Bot
const botSettings =
{
    token: token,
    autorun: true,
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_SCHEDULED_EVENTS
    ]
};
const client = new Discord.Client( botSettings );

// Login to Discord
client.login( token );

//-------------------------
// Discord Event Responses
//-------------------------

/**
 * 
 */
function onReady( evt )
{
    console.log( 'Connected' );
    console.log( 'Logged in as:');
    console.log( client.username + ' - (' + client.id + ')' );
}
client.once( 'ready', onReady );

/**
 * 
 */
async function onInteractionCreate( interaction )
{
    if ( interaction.isCommand() )
    {
        let name = interaction.options.getSubcommand();
        let cb = commandCallbacks[name ?? ''];

        if ( cb )
        {
            console.log( 'Running command: ' + interaction );
            await cb( interaction, interaction.options );
        }
        else
        {
            let str = randomDogNoise() + " I don't know what that means! " + randomDogNoise();
            await interaction.reply( str );
        }
    }
}
client.on( 'interactionCreate', onInteractionCreate );

async function onMessageReactionAdd( reaction, user )
{
    // Get the message
    let message = reaction.message;

    // Check if it's for the ongoing raffle
    if ( ongoingRaffle && ongoingRaffle.active && message.id == ongoingRaffle.message.id )
    {
        // Add to the raffle
        await ongoingRaffle.addUser( user );
    }
    else
    {
        console.log('reacted to a different message');
    }
}
client.on( 'messageReactionAdd', onMessageReactionAdd );

//-----------
// Constants
//-----------
const CHAMPION = 'Champion';
const TOASTER = 'Toaster';

//-------
// Types
//-------
class Raffle
{
    /**
     *
     */
    constructor( message, endTime )
    {
        this.active = true;
        this.message = message;
        this.endTime = endTime;
        this.members = [];
        console.log( 'Started a raffle ending at ' + endTime );
    }

    /**
     * 
     */
    addMember( member )
    {
        if ( !this.members.some( m => m.user.id == member.user.id ))
        {
            this.members.push( member );
            console.log( 'Added ' + getName( member ) + ' to the ongoing raffle' );
        }
        else
        {
            console.log( getName( member ) + ' is already in the raffle' );
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

    /**
     *
     */
    async runRaffle()
    {
        // Choose a random member
        let index = Math.floor( Math.random() * this.members.length );

        // Choose the winner
        let winner = this.members[index];

        // Announce the raffle
        let memberNames = this.members.map( m => getName( m ) );
        let resp = randomDogNoise() + ' Running a raffle with ' + oxfordComma( memberNames ) + '!';
        this.message.reply( resp );

        // Announce the winner
        let winnerName = getName( winner );
        resp = winnerName + ' wins! ' + randomDogNoise() + ' ' + randomDogNoise();
        this.message.reply( resp );

        // No longer active
        this.active = false;
    }
}

//--------------
// File Statics
//--------------
var ongoingRaffle = null;

//-------------------
// Command Callbacks
//-------------------

var commandCallbacks = {};

/**
 * 
 */
async function helpCb( interaction, options )
{
    let str = 'Here are the commands you can use! ' + randomDogNoise();

    for (let cmd of subcommands)
    {
        str += '\n/dog';
        str += ' ' + cmd.name;

        // TODO: Options

        str += ': ' + cmd.description;
    }

    await interaction.reply( str );
}
commandCallbacks[''] = helpCb;

/**
 * 
 */
async function champCb( interaction, options )
{
    // Get all members with the champion role
    let champions = getChampions( interaction );

    let str;
    if ( champions )
    {
        

        if ( champions.length == 1 )
        {
            let name = getName( champions[0] );
            str = 'The current champion is ' + name + '! ' + randomDogNoise();
        }
        else
        {
            str = 'The current champions are ';

            let names = champions.map ( c => getName(c) );
            str += oxfordComma( names );

            str += '! ' + randomDogNoise();
        }
    }
    else
    {
        str = 'There is no current champion! Oh no! ' + randomDogNoise();
    }

    await interaction.reply( str );
}
commandCallbacks['champ'] = champCb;

/**
 * 
 */
async function newchampCb( interaction, options )
{
    // Get the champion role
    let champRole = getRole( interaction, CHAMPION );

    // Get all current champions
    let curChamps = getChampions( interaction );

    // Remove the champion role from all current champions
    for ( let champ of curChamps )
    {
        champ.roles.remove( champRole );
    }

    // Get the chosen member
    let member = options.getMember( 'user' );

    // Add the champion role to the member
    member.roles.add( champRole );

    // Give us the dog
    interaction.guild.setIcon( 'glovedog.jpg' );

    // Reply to the user
    let str = 'The new champion is ' + getName( member ) + '! ' + randomDogNoise();
    await interaction.reply( str );
}
commandCallbacks['newchamp'] = newchampCb;

/**
 * 
 */
async function raffleCb( interaction, options )
{
    // Get the duration of the raffle in minutes
    let duration = options.getInteger( 'duration' );

    if ( duration === null || ongoingRaffle )
    {
        if ( ongoingRaffle )
        {
            let str = '';
            str += "There's a raffle happening! " + randomDogNoise();
            str += '\nIt ends at ' + ongoingRaffle.endTime.toLocaleTimeString() + '!';
            str += '\nIt has ' + oxfordComma( ongoingRaffle.members.map( m => getName( m ) ) ) + '!';
            await interaction.reply( str );
        }
        else
        {
            let str = '';
            str += "There's no raffle happening right now! " + randomDogNoise();
            str += "\nStart one with /dog raffle <duration>!";
            await interaction.reply( str );
        }

        return;
    }

    // Defer the reply because this is going to take a while
    await interaction.deferReply();

    // Get the current time/date
    let now = new Date();

    // Get the time to end the raffle
    let endTime = new Date( now.getTime() + duration * 60 * 1000 );
    let endTimeStr = endTime.toLocaleTimeString();

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
        let messages = await getMessagesSince( channel, dayTime );
        let contents = messages.map( m => m.content );

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
    let toasterRole = getRole( interaction, TOASTER );

    // Get all non-bot members
    let realMembers = allMembers.filter( m => !m.roles.cache.some( r => r.id === toasterRole.id ) );

    // Get members who posted recently
    let postMembers = realMembers.filter( m => postUserIds.has( m.user.id ) );

    // Create the response
    let resp = '';
    resp += 'Raffle time! ' + randomDogNoise();
    resp += '\nThis raffle will end at ' + endTimeStr + '!';
    resp += '\nReact to this message to enter!';
    
    if ( postMembers )
    {
        let names = postMembers.map( m => getName( m ) );
        resp += '\n' + oxfordComma(names) + " posted today! I'll put them in the raffle!";
    }

    // Reply to the user
    let origMessage = await interaction.followUp( resp );

    // Create a new raffle
    ongoingRaffle = new Raffle( origMessage, endTime );

    // Add the members who recently posted to the raffle
    for ( let member of postMembers )
    {
        ongoingRaffle.addMember( member );
    }

    // Set the timeout to run the raffle
    let timeoutTime = endTime.getTime() - now.getTime();
    setTimeout(
        () =>
        {
            if ( ongoingRaffle === null || !ongoingRaffle.active )
                return;  // Already ran

            // Run the raffle
            ongoingRaffle.runRaffle();

            // Clear the raffle pointer
            ongoingRaffle = null;
        },
        timeoutTime
    );
    console.log( 'Set a timeout for ' + timeoutTime + ' milliseconds');

    // TEMP
    //ongoingRaffle = null;
}
commandCallbacks['raffle'] = raffleCb;

//------------------
// Helper Functions
//------------------

const DOG_NOISES = [ 'Woof!', 'Arf!', 'Bow-wow!', 'Ruff!', 'Bark!' ];
function randomDogNoise()
{
    return DOG_NOISES[Math.floor( Math.random() * DOG_NOISES.length )];
}

function oxfordComma(inputs)
{
    let output = '';

    for ( let i in inputs )
    {
        if ( i == 0 )
        {
            // Nothing before the first item
        }
        else if ( i == inputs.length - 1 )
        {
            if ( inputs.length > 2 )
            {
                output += ', and ';
            }
            else
            {
                output += ' and ';
            }
        }
        else
        {
            output += ', ';
        }

        output += inputs[i];
    }

    return output;
}

function getName( member )
{
    return member.nickname ?? member.user.username;
}

function getRole( interaction, name )
{
    return interaction.guild.roles.cache.find( r => r.name === name );
}

function getChampions( interaction )
{
    // Get the champion role
    let role = getRole( interaction, CHAMPION );

    // Get all members with that role
    return role.members.map( m => m );
}

async function getMessagesSince( channel, sinceDate )
{
    let found = [];

    // Keep searching until a message before the date is found
    let options = { limit : 50 };
    for (;;)
    {
        // Run the query
        let results = await channel.messages.fetch( options );
        results = Array.from( results.values() );  // Convert to array because fuck everything thfofjzdfsnunosidthgsrdzjerompwdfxih8vctxwqj;oc hyw8c 

        if ( !results )
        {
            // No more results
            break;
        }

        // Find the earliest message
        let earliest = null;
        for ( let m of results )
        {
            if ( earliest === null || m.createdTimestamp < earliest.createdTimestamp )
            {
                earliest = m;
            }
        }

        // Set the next query to look before the earliest message
        options.before = earliest.id;

        // Add to the list of found messages
        found = found.concat( results );

        if ( earliest.createdAt < sinceDate )
        {
            // No need to go further
            break;
        }
    }

    // Return messages after the given date
    return found.filter( m => m.createdAt >= sinceDate );
}
