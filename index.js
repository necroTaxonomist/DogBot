
//-------
// Setup
//-------
const { token } = require( './config.json' );
const Discord = require( 'discord.js' );
const { subcommands } = require( './deploy-commands' );
const rankings = require( './rankings' );
const bracket = require( './bracket' );
const DiscordExt = require( './discordext' );
const StrExt = require( './strext' );

const TimedEvent = require( './timedevent' );
const Raffle = require( './raffle' );
const Vote = require( './vote' );

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
    TimedEvent.postReaction( reaction, user );
}
client.on( 'messageReactionAdd', onMessageReactionAdd );

//-----------
// Constants
//-----------
const CHAMPION = 'Champion';
const TOASTER = 'Toaster';

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
    let temp = await interaction.guild.roles.fetch();

    // Get all members with the champion role
    let champions = getChampions( interaction );

    let str;
    if ( champions )
    {
        console.log( champions );
        if ( champions.length == 1 )
        {
            let name = DiscordExt.getName( champions[0] );
            str = 'The current champion is ' + name + '! ' + randomDogNoise();
        }
        else
        {
            str = 'The current champions are ';

            let names = champions.map ( c => DiscordExt.getName(c) );
            str += StrExt.oxfordComma( names );

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
    let champRole = DiscordExt.getRole( interaction, CHAMPION );

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
    let str = 'The new champion is ' + DiscordExt.getName( member ) + '! ' + randomDogNoise();
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
            str += '\nIt has ' + StrExt.oxfordComma( ongoingRaffle.members.map( m => DiscordExt.getName( m ) ) ) + '!';
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

    // Get the current time/date
    let now = new Date();

    // Get the time to end the raffle
    let endTime = new Date( now.getTime() + duration * 60 * 1000 );

    // Create a new raffle
    ongoingRaffle = new Raffle();

    // Start the raffle
    ongoingRaffle.start( interaction, endTime );
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
        await ongoingRaffle.finishEarly();

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
async function rankingsCb( interaction, options )
{
    let count = options.getInteger( 'count' ) ?? 10;

    let data;
    try
    {
        data = await rankings.getRankings( count );
    }
    catch ( ex )
    {
        let respStr = "I couldn't get the rankings! " +
                      randomDogNoise() + ' ' +
                      "Because of " + ex+ "!";
        await interaction.reply( respStr );
        return;
    }

    let respStr = 'These are the rankings! ' + randomDogNoise();
    for ( let player of data )
    {
        respStr += '\n' + player.rank + ': ' + player.name + ' (' + player.wins + ' wins)';
    }

    await interaction.reply( respStr );
}
commandCallbacks['rankings'] = rankingsCb;

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
async function bracketMatchesCb( interaction, options )
{
    let url = options.getString( 'url' );

    if ( !url )
    {
        url = lastBracketUrl;

        if ( !url )
        {
            let respStr = "I don't know which bracket to look at! " + randomDogNoise();
            await interaction.reply( respStr );
            return;
        }
    }
    else
    {
        lastBracketUrl = url;
    }

    let players = await bracket.indexParticipants( url );
    if ( players.error )
    {
        let respStr = "I couldn't get the participants! " +
                      randomDogNoise() + ' ' +
                      "Because of " + players.text + "!";
        await interaction.reply( respStr );
        return;
    }

    let matches = await bracket.indexMatches( url );
    if ( matches.error )
    {
        let respStr = "I couldn't get the matches! " +
                      randomDogNoise() + ' ' +
                      "Because of " + matches.text + "!";
        await interaction.reply( respStr );
        return;
    }

    let respStr = 'Here are the open matches! ' + randomDogNoise();

    let curRound = 0;
    for ( let i = 0; /*in loop*/; ++i)
    {
        let item = matches[i];
        if ( !item )
        {
            // Reached the end
            break;
        }

        let match = item.match;

        if ( match.state != 'open' )
        {
            // Not an open match
            continue;
        }

        if ( match.round != curRound )
        {
            curRound = match.round;
            if ( curRound > 0 )
            {
                respStr += '\n__Winners Round ' + curRound + '__';
            }
            else
            {
                respStr += '\n__Losers Round ' + curRound + '__';
            }
        }

        let player1Name = idToPlayer( match.player1Id, players );
        let player2Name = idToPlayer( match.player2Id, players );
        respStr += '\n' + player1Name + ' vs ' + player2Name;
    }

    if ( curRound == 0 )
    {
        respStr = 'No ongoing matches! ' + randomDogNoise();
    }

    await interaction.reply( respStr );
}
commandCallbacks['bracketmatches'] = bracketMatchesCb;

/**
 * 
 */
async function bracketReportCb( interaction, options )
{
    let winner = options.getString( 'winner' );
    let score = options.getString( 'score' );
    let url = options.getString( 'url' );

    let winnerScore, loserScore;
    if ( !score )
    {
        winnerScore = 1;
        loserScore = 0;
    }
    else
    {
        let hyphenIndex = score.indexOf('-');
        let leftScore = parseInt( score.substring( 0, hyphenIndex ) );
        let rightScore = parseInt( score.substring( hyphenIndex + 1) );
        
        if ( hyphenIndex < 0 || isNaN( leftScore ) || isNaN( rightScore ) )
        {
            let respStr = "Not a valid score! " + randomDogNoise();
            await interaction.reply( respStr );
            return;
        }

        winnerScore = Math.max( leftScore, rightScore );
        loserScore = Math.min( leftScore, rightScore );
    }

    if ( !url )
    {
        url = lastBracketUrl;

        if ( !url )
        {
            let respStr = "I don't know which bracket to look at! " + randomDogNoise();
            await interaction.reply( respStr );
            return;
        }
    }
    else
    {
        lastBracketUrl = url;
    }

    let players = await bracket.indexParticipants( url );
    if ( players.error )
    {
        let respStr = "I couldn't get the participants! " +
                      randomDogNoise() + ' ' +
                      "Because of " + players.text + "!";
        await interaction.reply( respStr );
        return;
    }

    let matches = await bracket.indexMatches( url );
    if ( matches.error )
    {
        let respStr = "I couldn't get the matches! " +
                      randomDogNoise() + ' ' +
                      "Because of " + matches.text + "!";
        await interaction.reply( respStr );
        return;
    }

    let winnerId = playerToId( winner, players );

    for ( let i = 0; /*in loop*/; ++i)
    {
        let item = matches[i];
        if ( !item )
        {
            let respStr = "I couldn't find an open match with that player! " + randomDogNoise();
            await interaction.reply( respStr );
            return;
        }

        let match = item.match;

        if ( match.state != 'open' )
        {
            // Not an open match
            continue;
        }

        if ( match.player1Id == winnerId || match.player2Id == winnerId )
        {
            let orderedScore;
            if ( match.player1Id == winnerId )
            {
                orderedScore = winnerScore + '-' + loserScore;
            }
            else
            {
                orderedScore = loserScore + '-' + winnerScore;
            }

            let result = await bracket.updateMatch( url, match.id, orderedScore, winnerId );
            if ( result.error )
            {
                let respStr = "I couldn't report the match! " +
                            randomDogNoise() + ' ' +
                            "Because of " + result.errors[0] + "!";
                await interaction.reply( respStr );
                return;
            }

            let player1Name = idToPlayer( match.player1Id, players );
            let player2Name = idToPlayer( match.player2Id, players );
            let respStr = 'Reported ' + winner + ' as the winner of ' +
                          player1Name + ' vs ' + player2Name +
                          ' (' + orderedScore + ')! ' +
                          randomDogNoise();
            await interaction.reply( respStr );
            return;
        }
    }
}
commandCallbacks['bracketreport'] = bracketReportCb;

/**
 * 
 */
async function debugCb( interaction, options )
{
    //await interaction.reply(randomDogNoise());

    let duration = 5;

    // Get the current time/date
    let now = new Date();

    // Get the time to end the raffle
    let endTime = new Date( now.getTime() + duration * 1000 );

    let opts = [
        {
            emoji: '🍎',
            name: 'Apples'
        },
        {
            emoji: '🍇',
            name: 'Grapes'
        }
    ];

    let vote = new Vote( opts );

    await vote.start( interaction, endTime );
}
commandCallbacks['debug'] = debugCb;

//------------------
// Helper Functions
//------------------

function randomDogNoise()
{
    return StrExt.randomDogNoise();
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

function getChampions( interaction )
{
    return DiscordExt.getMembersWithRole( interaction, CHAMPION );
}

function idToPlayer( id, players )
{
    for ( let i = 0; /*in loop*/; ++i )
    {
        let item = players[i];
        if ( !item )
        {
            return 'Unknown';
        }

        let player = item.participant;

        if ( id == player.id )
        {
            return player.name;
        }
    }
}

function playerToId( name, players )
{
    for ( let i = 0; /*in loop*/; ++i )
    {
        let item = players[i];
        if ( !item )
        {
            return null;
        }

        let player = item.participant;

        if ( name == player.name )
        {
            return player.id;
        }
    }
}