
const TimedEvent = require('./timedevent');
const DiscordExt = require( './discordext' );
const StrExt = require( './strext' );

class Vote extends TimedEvent
{
    /**
     *
     */
    constructor( options )
    {
        // Call the parent constructor
        super();

        // Initialize the options list
        this.options = new Array();

        // Add all of the options
        for ( let o of options )
        {
            this.options.push( o );
        }
    }

    /**
     * 
     */
    async start( interaction, endTime)
    {
        // Create the response
        let resp = '';
        resp += 'Calling a vote! ' + StrExt.randomDogNoise();
        for ( let o of this.options )
        {
            resp += '\n' + o.emoji + ': ' + o.name;
        }

        // Reply to the user
        await interaction.deferReply();
        let message = await interaction.followUp( resp );

        // Add the options as reacts
        for ( let o of this.options )
        {
            await message.react( o.emoji );
        }

        // Activate
        this.activate( message, endTime );
    }

    /**
     *
     */
    async run()
    {
        // Fetch the message
        this.message = await this.message.fetch();

        // Get all the reactions
        let reacts = Array.from( this.message.reactions.cache.values() );

        // Make the reacts more palatabale
        reacts = reacts.map(
            r =>
            {
                let item =
                {
                    emoji: r._emoji.name,
                    count: r.count
                };
                return item;
            }
        );

        // Only consider reactions that are part of the options
        reacts = reacts.filter(
            r => this.options.some( o => o.emoji == r.emoji )
        );

        // Sort by count
        reacts.sort(
            (a, b) => b.count - a.count
        );

        // Check for a tie
        if ( reacts.length == 1 || reacts[1].count == reacts[0].count )
        {
            await this.message.reply( "It's a tie! " + StrExt.randomDogNoise() );
            return;
        }

        // Get the winning option
        let winner = this.options.find(
            o => o.emoji == reacts[0].emoji
        );

        // Report the winner
        await this.message.reply( "The winner is " + winner.name + "! " + StrExt.randomDogNoise() );
    }

    /**
     *
     */
    async onReaction( reaction, user )
    {
        // Do nothing
    }
}
module.exports = Vote;
