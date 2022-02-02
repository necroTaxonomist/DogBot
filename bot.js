var Discord = require( 'discord.io' );
var logger = require( 'winston' );
var auth = require( './auth.json');

// Configure logger settings
logger.remove( logger.transports.Console );
logger.add( new logger.transports.Console, { colorize: true } );
logger.level = 'debug';

// Initialize Discord Bot
var botSettings =
    {
        token: auth.token,
        autorun: true
    };
var bot = new Discord.Client( botSettings );

/**
 * 
 */
function onReady( evt )
{
    logger.info( 'Connected' );
    logger.info( 'Logged in as:');
    logger.info( bot.username + ' - (' + bot.id + ')' );
}
bot.on( 'ready', onReady );

/**
 * 
 */
function onMessage( user, userId, channelId, message, evt )
{
    // TODO
}
bot.on( 'message', onMessage );
