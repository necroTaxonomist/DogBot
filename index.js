
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
        let cb = commandCallbacks[name];

        if ( cb )
        {
            console.log( "Running command: " + interaction );
            await cb( interaction );
        }
        else
        {
            // TODO: Error
        }
    }
}
client.on( 'interactionCreate', onInteractionCreate );

//-----------
// Constants
///----------
const CHAMPION = 'Champion';

//-------------------
// Command Callbacks
//-------------------

var commandCallbacks = {};

/**
 * 
 */
async function champCb( interaction )
{
    // Get the champion role
    let role = interaction.guild.roles.cache.find( r => r.name === CHAMPION );

    // Get memebers with that role
    console.log( role.members );
    let members = role.members.map( m => m );
    console.log( members );

    let str;
    if ( members )
    {
        let nickname = members[0].nickname;
        let username = members[0].user.username;
        let name = (nickname === null) ? username : nickname;
        str = 'The current champion is ' + name + "! " + randomDogNoise();
    }
    else
    {
        str = 'There is no current champion! Oh no! ' + randomDogNoise();
    }

    await interaction.reply( str );
}
commandCallbacks["champ"] = champCb;

//-----------------
// Other Functions
//-----------------

const DOG_NOISES = [ 'Woof!', 'Arf!', 'Bow-wow!', 'Ruff!' ];
function randomDogNoise()
{
    return DOG_NOISES[Math.floor( Math.random() * DOG_NOISES.length )];
}