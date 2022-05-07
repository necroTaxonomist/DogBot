
//-------
// Setup
//-------
const { token, clientId, guildId } = require( './config.json');
const { SlashCommandBuilder } = require( '@discordjs/builders' );
const { REST } = require( '@discordjs/rest' );
const { Routes } = require( 'discord-api-types/v9' );

const topCommand = new SlashCommandBuilder()
    .setName( 'dog' )
    .setDescription( 'Top-level DogBot command' )
    .addSubcommand( subcommand => subcommand
        .setName( 'champ' )
        .setDescription( 'Displays the current champion' )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'newchamp' )
        .setDescription( 'Sets the new champion' )
        .addUserOption( option => option
            .setName( 'user' )
            .setDescription( 'The user to make the new chamption' )
            .setRequired(true)
        )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'raffle' )
        .setDescription( 'Starts a raffle, or checks the status of the ongoing raffle' )
        .addIntegerOption( option => option
            .setName( 'duration' )
            .setDescription( 'Duration of the raffle in minutes' )
        )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'stopraffle' )
        .setDescription( 'Finishes the ongoing raffle' )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'rankings' )
        .setDescription( 'Displays the current PTS rankings' )
        .addIntegerOption( option => option
            .setName( 'count' )
            .setDescription( 'Number of players to display (default 10)' )
        )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'createbracket' )
        .setDescription( 'Creates a Challonge bracket' )
        .addStringOption( option => option
            .setName( 'name' )
            .setDescription( 'The name of the bracket' )
            .setRequired(true)
        )
        .addStringOption( option => option
            .setName( 'url' )
            .setDescription( 'The url for the bracket' )
        )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'bracketadduser' )
        .setDescription( 'Adds a user to a Challonge bracket' )
        .addUserOption( option => option
            .setName( 'user' )
            .setDescription('The user to add')
            .setRequired(true)
        )
        .addStringOption( option => option
            .setName( 'url' )
            .setDescription( 'The url for the bracket (defaults to last used)' )
        )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'bracketaddname' )
        .setDescription( 'Adds a participant to a Challonge bracket' )
        .addStringOption( option => option
            .setName( 'name' )
            .setDescription( 'The name of the participant' )
            .setRequired(true)
        )
        .addStringOption( option => option
            .setName( 'url' )
            .setDescription( 'The url for the bracket (defaults to last used)' )
        )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'bracketmatches' )
        .setDescription( 'View all open matches in a Challonge bracket' )
        .addStringOption( option => option
            .setName( 'url' )
            .setDescription( 'The url for the bracket (defaults to last used)' )
        )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'bracketreport' )
        .setDescription( 'Report the results of a Challonge match' )
        .addStringOption( option => option
            .setName( 'winner' )
            .setDescription( 'The winner of the match' )
            .setRequired( true )
        )
        .addStringOption( option => option
            .setName( 'score' )
            .setDescription( 'The score for the match, formatted #-#' )
            .setRequired( true )
        )
        .addStringOption( option => option
            .setName( 'url' )
            .setDescription( 'The url for the bracket (defaults to last used)' )
        )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'debug' )
        .setDescription( 'Woof' )
    )
    ;

const commands = [ topCommand ].map( command => command.toJSON() );

exports.subcommands = commands[0].options;

const rest = new REST( { version: '9' } ).setToken( token );

async function refreshCommands()
{
    try
    {
        console.log( 'Started refreshing application (/) commands.' );
    
        await rest.put(
            Routes.applicationGuildCommands( clientId, guildId ),
            { body: commands },
        );

        console.log( 'Successfully reloaded application (/) commands.' );
    }
    catch ( error )
    {
        console.error( error );
    }
}
refreshCommands();
