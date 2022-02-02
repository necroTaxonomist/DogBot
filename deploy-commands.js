
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