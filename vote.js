
const TimedEvent = require('./timedevent');
const DiscordExt = require( './discordext' );
const StrExt = require( './strext' );

class Vote extends TimedEvent
{
    //-----------
    // Constants
    //-----------
    static TOTAL_VOTES_INIT_STR = "Total Votes: 0";
    static TOTAL_VOTES_REGEX = /(Total Votes: )(\d+)/ug;

    //--------------
    // Constructors
    //--------------

    /**
     *
     */
    constructor( options, secret )
    {
        // Call the parent constructor
        super();

        // Set if this is a secret vote
        this.secret = secret;

        // Results for secret votes
        this.secretResults = new Map();

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
        resp += '\n'+ Vote.TOTAL_VOTES_INIT_STR;
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

        // Need to get the raw react data
        let reacts;
        if ( this.secret )
        {
            // Get the secret results
            reacts = Array.from( this.secretResults.values() );
        }
        else
        {
            // Get all the reactions
            reacts = Array.from( this.message.reactions.cache.values() );
        }

        // Make the reacts more palatable
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
        console.log( reacts );

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
        if ( user.username == 'DogBot' )  // There's probably a safer way to check this
        {
            // Ignore
            return;
        }

        if ( this.secret )
        {
            // Get the emoiji
            let emoji = reaction._emoji.name;

            // Fetch the message
            this.message = await this.message.fetch();

            // Remove the reaction by the user
            await reaction.users.remove( user );

            // Verify that it's a valid vote
            if ( !this.options.some( o => o.emoji == emoji))
            {
                console.log('Invalid vote ' + emoji + ' from user ' + user.username );

                // Notify the user
                await user.send( emoji + 'is not a valid vote! ' + StrExt.randomDogNoise() );
            }
            else
            {
                if ( this.secretResults.has( user.id ) )
                {
                    console.log('Changed vote ' + emoji + ' from user ' + user.username );

                    // Notify the user
                    await user.send('You changed your vote to ' + reaction._emoji.name + '! ' + StrExt.randomDogNoise() );
                }
                else
                {
                    console.log('Vote ' + emoji + ' from user ' + user.username );

                    // Notify the user
                    await user.send('You voted ' + reaction._emoji.name + '! ' + StrExt.randomDogNoise() );
                }

                // Update the secret results
                this.secretResults.set( user.id, reaction );

                // Get the edited content string
                let newContent = this.message.content.replace( Vote.TOTAL_VOTES_REGEX, '$1' + this.secretResults.size );

                // Edit the message content
                await this.message.edit( newContent );
            }
        }
    }
}
module.exports = Vote;
