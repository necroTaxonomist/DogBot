
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
            .setDescription('The user to make the new chamption')
            .setRequired(true)
        )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'raffle' )
        .setDescription( 'Starts a raffle, or checks the status of the ongoing raffle' )
        .addIntegerOption( option => option
            .setName( 'duration' )
            .setDescription('Duration of the raffle in minutes')
        )
    )
    .addSubcommand( subcommand => subcommand
        .setName( 'stopraffle' )
        .setDescription( 'Finishes the ongoing raffle' )
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