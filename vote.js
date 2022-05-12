
const TimedEvent = require('./timedevent');
const DiscordExt = require( './discordext' );
const StrExt = require( './strext' );

class Vote extends TimedEvent
{
    //--------------
    // Constructors
    //--------------

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

    //---------
    // Methods
    //---------
    async blurb( endTime )
    {
        // Subclasses should override this
        let resp = '';
        resp += 'Calling a vote! ' + StrExt.randomDogNoise();
        resp += ' It ends at ' + endTime.toLocaleTimeString() + '!';
        for ( let o of this.options )
        {
            resp += '\n' + o.emoji + ': ' + o.name;
        }
        return resp;
    }
    
    async onTie( reacts )
    {
        // Subclasses should override this
        await this.message.reply( "It's a tie! " + StrExt.randomDogNoise() );
    }

    async onWin( reacts, winner )
    {
        // Subclasses should override this
        await this.message.reply( "The winner is " + winner.name + "! " + StrExt.randomDogNoise() );
    }

    //---------------------------
    // Inherited from TimedEvent
    //---------------------------

    /**
     * 
     */
    async start( interaction, endTime )
    {
        // Defer the reply
        await interaction.deferReply();

        // Get the blub
        let resp = await this.blurb( endTime );

        // Reply to the user
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
    async startByReply( message, endTime )
    {
        // Get the blub
        let resp = await this.blurb( endTime );

        // Reply to the user
        let newMessage = await message.reply( resp );

        // Add the options as reacts
        for ( let o of this.options )
        {
            await newMessage.react( o.emoji );
        }

        // Activate
        this.activate( newMessage, endTime );
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
                    count: r.count - 1
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
        if ( (reacts.length < 0) || ((reacts.length > 1) && (reacts[1].count == reacts[0].count)) )
        {
            await this.onTie( reacts );
            return;
        }

        // Get the winning option
        let winner = this.options.find(
            o => o.emoji == reacts[0].emoji
        );

        // Report the winner
        await this.onWin( reacts, winner );
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
