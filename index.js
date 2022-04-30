
//-------
// Setup
//-------
const { token } = require( './config.json' );
const Discord = require( 'discord.js' );
const { subcommands } = require( './deploy-commands.js' );
const bracket = require( './bracket.js' );

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
        await this.message.reply( resp );

        // Announce the winner
        let winnerName = getName( winner );
        resp = winnerName + ' wins! ' + randomDogNoise() + ' ' + randomDogNoise();
        await this.message.reply( resp );

        // No longer active
        this.active = false;
    }
}

//--------------
// File Statics
//--------------
var ongoingRaffle = null;
var lastBracketUrl = null;

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

    if ( duration === null || (ongoingRaffle && ongoingRaffle.active) )
    {
        if ( ongoingRaffle && ongoingRaffle.active )
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
        async () =>
        {
            if ( ongoingRaffle === null || !ongoingRaffle.active )
                return;  // Already ran

            // Run the raffle
            await ongoingRaffle.runRaffle();

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

/**
 * 
 */
async function stopRaffleCb( interaction, options )
{
    if ( ongoingRaffle && ongoingRaffle.active )
    {
        let str = '';
        str += "Ending the raffle early! " + randomDogNoise();
        await interaction.reply( str );

        // Run the raffle
        await ongoingRaffle.runRaffle();

        // Clear the raffle pointer
        ongoingRaffle = null;
    }
    else
    {
        let str = '';
        str += "There's no raffle happening right now! " + randomDogNoise();
        str += "\nStart one with /dog raffle <duration>!";
        await interaction.reply( str );
    }
}
commandCallbacks['stopraffle'] = stopRaffleCb;

/**
 * 
 */
async function createBracketCb( interaction, options )
{
    let name = options.getString( 'name' );
    let url = options.getString( 'url' );

    let resp = await bracket.createTournament(name, url );

    if ( resp.error )
    {
        let respStr = "I couldn't create a bracket! " +
                      randomDogNoise() + ' ' +
                      "Because of " + resp.errors[0] + "!";
        await interaction.reply( respStr );
        return;
    }

    lastBracketUrl = resp.tournament.url;

    let respStr = 'I made a bracket called ' + resp.tournament.name + '! ' +
                  randomDogNoise() + '\n' +
                  'The bracket is here! ' + randomDogNoise() + ' https://challonge.com/' + resp.tournament.url;
    await interaction.reply( respStr );
}
commandCallbacks['createbracket'] = createBracketCb;

/**
 * 
 */
async function bracketAddUserCb( interaction, options )
{
    let url = options.getString( 'url' );
    let member = options.getMember( 'user' );

    if ( !url )
    {
        url = lastBracketUrl;

        if ( !url )
        {
            let respStr = "I don't know which bracket to add to! " + randomDogNoise();
            await interaction.reply( respStr );
            return;
        }
    }
    else
    {
        lastBracketUrl = url;
    }

    let name;
    if ( true )
    {
        let respStr = "I don't know that user's name! " + randomDogNoise();
        await interaction.reply( respStr );
        return;
    }

    let resp = await bracket.createParticipant( url, name, member.user.id );

    if ( resp.error )
    {
        let respStr = "I couldn't add the participant! " +
                      randomDogNoise() + ' ' +
                      "Because of " + resp.errors[0] + "!";
        await interaction.reply( respStr );
        return;
    }

    let respStr = 'I added ' + resp.participant.name + 'to ' +
                  resp.participant.tournament_id + '!' + randomDogNoise();
    await interaction.reply( respStr );
}
commandCallbacks['bracketadduser'] = bracketAddUserCb;

/**
 * 
 */
async function bracketAddNameCb( interaction, options )
{
    let url = options.getString( 'url' );
    let name = options.getString( 'name' );

    if ( !url )
    {
        url = lastBracketUrl;

        if ( !url )
        {
            let respStr = "I don't know which bracket to add to! " + randomDogNoise();
            await interaction.reply( respStr );
            return;
        }
    }
    else
    {
        lastBracketUrl = url;
    }

    let resp = await bracket.createParticipant( url, name, null );

    if ( resp.error )
    {
        let respStr = "I couldn't add the participant! " +
                      randomDogNoise() + ' ' +
                      "Because of " + resp.errors[0] + "!";
        await interaction.reply( respStr );
        return;
    }

    let respStr = 'I added ' + resp.participant.name + ' to ' +
                  resp.participant.tournamentId + '! ' + randomDogNoise();
    await interaction.reply( respStr );
}
commandCallbacks['bracketaddname'] = bracketAddNameCb;

/**
 * 
 */
async function debugCb( interaction, options )
{
    await instruction.reply(randomDogNoise());
}
commandCallbacks['debug'] = debugCb;

//------------------
// Helper Functions
//------------------

const DOG_NOISES = [ 'Woof!', 'Arf!', 'Bow-wow!', 'Ruff!', 'Bark!' ];
function randomDogNoise()
{
    return DOG_NOISES[Math.floor( Math.random() * DOG_NOISES.length )];
}

function oxfordComma( inputs )
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

function editDistance( s, t )
{
    // Wagner-Fischer algorithm
    // https://en.wikipedia.org/wiki/Wagner%E2%80%93Fischer_algorithm

    // The Wagner-Fischer algorithm computes edit distance based on the observation that if we
    // reserve a matrix to hold the edit distances between all prefixes of the first string and all
    // prefixes of the second, then we can compute the values in the matrix by flood filling the
    // matrix, and thus find the distance between the two full strings as the last value computed.
    //
    // A straightforward implementation, as pseudocode for a function Distance that takes two
    // strings, s of length m, and t of length n, and returns the Levenshtein distance between
    // them, looks as follows. Note that the input strings are one-indexed, while the matrix d is
    // zero-indexed, and [i..k] is a closed range.
    let m = s.length;
    let n = t.length;

    // for all i and j, d[i,j] will hold the distance between
    // the first i characters of s and the first j characters of t
    // note that d has (m+1)*(n+1) values
    let d = new Array( m + 1 ).fill( 0 ).map( () => new Array( n + 1 ).fill( 0 ) );
    console.log('inited d');
    console.log(d);
 
    // source prefixes can be transformed into empty string by
    // dropping all characters
    for ( let i = 1; i <= m; ++i )
    {
        d[i][0] = i;
    }
 
    // target prefixes can be reached from empty source prefix
    // by inserting every character
    for ( let j = 1; j <= n; ++j )
    {
        d[0][j] = j;
    }

    console.log('d[0, 0] = ' + d[0][0]);

    for ( let j = 1; j <= n; ++j )
    {
        for ( let i = 1; i <= m; ++i )
        {
            let substitutionCost;
            if ( s[i - 1] == t[j - 1] )
            {
                substitutionCost = 0;
            }
            else
            {
                substitutionCost = 1;
            }

            
            d[i][j] = Math.min( d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + substitutionCost );
            console.log('d[' + i + ',' + j + '] = ' + d[i][j]);
        }
    }

    return d[m][n]
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
