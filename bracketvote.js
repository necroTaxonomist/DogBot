
const Vote = require('./vote');
const StrExt = require( './strext' );
const Bracket = require( './bracket' );

class BracketVote extends Vote
{
    //-----------
    // Constants
    //-----------
    static MAX_LIGHTING_ROUND_DURATION = 5;
    static MIN_LIGHTING_ROUND_DURATION = 1;

    //--------------
    // Constructors
    //--------------

    /**
     *
     */
    constructor( url, match, player1, player2 )
    {
        // Determine the emoji to use for player 1
        let player1Emoji = player1.name.substring( 0, 2 );
        if ( !StrExt.isEmoji( player1Emoji) )
        {
            player1Emoji = '🅰️';
        }

        // Determine the emoji to use for player 2
        let player2Emoji = player2.name.substring( 0, 2 );
        if ( (player1Emoji == player2Emoji) || !StrExt.isEmoji( player2Emoji) )
        {
            player2Emoji = '🅱️';

            if ( player1Emoji == player2Emoji )
            {
                player2Emoji = '2️⃣';
            }
        }

        // Get the options from the match
        let options =
        [
            {
                emoji: player1Emoji,
                name: StrExt.removeEmojis( player1.name )
            },
            {
                emoji: player2Emoji,
                name: StrExt.removeEmojis( player2.name )
            }
        ];

        // Call the parent constructor
        super( options );

        // Record the match info
        this.url = url;
        this.match = match;
        this.player1 = player1;
        this.player2 = player2;
    }

    //---------
    // Methods
    //---------

    isLightningRound()
    {
        return this.duration <= BracketVote.MAX_LIGHTING_ROUND_DURATION * 60 * 1000
    }

    //---------------------
    // Inherited from Vote
    //---------------------

    async blurb( endTime )
    {
        let content = '';

        // Do this to check for the lightning round
        this.duration = endTime - (new Date());

        if ( this.isLightningRound() )
        {
            content += 'Lightning round! ' + StrExt.randomDogNoise();
        }
        else
        {
            content += 'Calling a vote! ' + StrExt.randomDogNoise();
        }

        content += ' It ends at ' + endTime.toLocaleTimeString() + '!';
        for ( let o of this.options )
        {
            content += '\n' + o.emoji + ': ' + o.name;
        }

        // TODO: Get files
        let files = [ './accessories.png', './beanshope.png' ];

        let resp =
        {
            content: content,
            files: files
        };
        return resp;
    }
    
    async onTie( reacts )
    {
        // Determine the lightning round duration
        let duration;
        if ( this.isLightningRound() )
        {
            duration = this.duration / 2;

            if ( duration < BracketVote.MIN_LIGHTING_ROUND_DURATION * 60 * 1000 )
            {
                duration = BracketVote.MIN_LIGHTING_ROUND_DURATION * 60 * 1000;
            }
        }
        else
        {
            duration = BracketVote.MAX_LIGHTING_ROUND_DURATION * 60 * 1000;
        }

        // Get the current time/date
        let now = new Date();

        // Get the time to end the raffle
        let endTime = new Date( now.getTime() + duration );

        // Construct the lightning round vote
        let vote = new BracketVote( this.url, this.match, this.player1, this.player2 );

        // Run the vote
        await vote.startByReply( this.message, endTime );
    }

    async onWin( reacts, winner )
    {
        await this.message.reply( "The winner is " + winner.name + "! " + StrExt.randomDogNoise() );

        let winnerScore = reacts[0].count;
        let loserScore = reacts[1].count;

        let score;
        let winnerId;
        if ( winner.name == StrExt.removeEmojis( this.player1.name ) )
        {
            score = winnerScore + '-' + loserScore;
            winnerId = this.player1.id;
        }
        else if ( winner.name == StrExt.removeEmojis( this.player2.name ) )
        {
            score = loserScore + '-' + winnerScore;
            winnerId = this.player2.id;
        }
        else
        {
            console.log("This shouldn't happen!");
        }

        await Bracket.updateMatch( this.url, this.match.id, score, winnerId );
    }
}
module.exports = BracketVote;
