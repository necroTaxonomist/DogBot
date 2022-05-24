
const Vote = require('./vote');
const StrExt = require( './strext' );
const Bracket = require( './bracket' );
const BracketDb = require( './bracketdb' );

class BracketVote extends Vote
{
    //-----------
    // Constants
    //-----------
    static MAX_LIGHTING_ROUND_DURATION = 10;
    static MIN_LIGHTING_ROUND_DURATION = 1;

    //--------------
    // Constructors
    //--------------

    /**
     *
     */
    constructor( url, match, player1, player2 )
    {
        // Get the options from the players names
        let options =
        [
            Bracket.separateName( player1.name, '🅰️' ),
            Bracket.separateName( player2.name, '🅱️' )
        ];

        if ( options[0].emoji == options[1].emoji )
        {
            if ( options[0].emoji != '🅱️' )
            {
                options[1].emoji = '🅱️';
            }
            else
            {
                options[1].emoji != '2️⃣';
            }
        }

        // Call the parent constructor
        // Bracket votes are always secret
        super( options, true );

        // Record the match info
        this.url = url;
        this.match = match;
        this.player1 = player1;
        this.player2 = player2;
        this.players = [ player1, player2 ];
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

        content += '\n'+ Vote.TOTAL_VOTES_INIT_STR;

        for ( let o of this.options )
        {
            content += '\n' + o.emoji + ': ' + o.name;
        }

        // Get the corresponding bracket entries
        let entries = new Array();
        for ( let o of this.options )
        {
            let entry = await BracketDb.findEntry( o.nameOnly, o.source, o.origEmoji );
            if ( entry != null )
            {
                entries.push( entry );
            }
        }
        console.log( entries );

        // Get the image filenames
        let files = entries.map( e => e.image ).filter( i => i != null );

        let resp =
        {
            content: content,
            files: files
        };

        // Mark the match in progress
        //await Bracket.startMatch( this.url, this.match.id );

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
        await this.message.reply( "The winner is " + winner.nameOnly + "! " + StrExt.randomDogNoise() );

        let winnerScore = reacts[0].count;
        let loserScore = (reacts.length > 1) ? reacts[1].count : 0;

        let score;
        let winnerId;
        if ( winner.fullName == this.player1.name )
        {
            score = winnerScore + '-' + loserScore;
            winnerId = this.player1.id;
        }
        else if ( winner.fullName == this.player2.name )
        {
            score = loserScore + '-' + winnerScore;
            winnerId = this.player2.id;
        }
        else
        {
            console.log("This shouldn't happen!");
        }

        await Bracket.reportMatch( this.url, this.match.id, score, winnerId );
    }
}
module.exports = BracketVote;
