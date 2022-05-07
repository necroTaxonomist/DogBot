
//-------
// Setup
//-------
const { challongeApiKey } = require( './config.json' );
const challonge = require( 'challonge' );

const client = challonge.createClient(
    {
        apiKey: challongeApiKey
    }
);

const util = require('util');

//-----------
// Functions
//-----------
async function runAction( action, obj )
{
    const wrapper =
        ( obj, callback) =>
        {
            obj.callback = callback;
            action( obj );
        };

    const prom = util.promisify( wrapper );

    try
    {
        let result = await prom( obj );
        return result;
    }
    catch ( ex )
    {
        return ex;
    }
}

async function createTournament( name, url )
{
    let obj =
    {
        tournament:
        {
            name: name,
            tournament_type: 'double elimination'
        }
    };

    if ( url )
    {
        obj.tournament.url = url;
    }

    return await runAction( o => client.tournaments.create( o ), obj );
}
module.exports['createTournament'] = createTournament;

async function createParticipant( url, name, misc )
{
    let obj =
    {
        id: url,
        participant:
        {
            name: name
        }
    };

    if ( misc )
    {
        obj.participant.misc = misc;
    }

    return await runAction( o => client.participants.create( o ), obj );
}
module.exports['createParticipant'] = createParticipant;

async function indexParticipants( url )
{
    let obj =
    {
        id: url
    };

    return await runAction( o => client.participants.index( o ), obj );
}
module.exports['indexParticipants'] = indexParticipants;

async function indexMatches( url )
{
    let obj =
    {
        id: url
    };

    return await runAction( o => client.matches.index( o ), obj );
}
module.exports['indexMatches'] = indexMatches;

async function updateMatch( url, matchId, score, winnerId )
{
    let obj =
    {
        id: url,
        matchId: matchId,
        match:
        {
            scoresCsv: score,
            winnerId: winnerId
        }
    };

    return await runAction( o => client.matches.update( o ), obj );
}
module.exports['updateMatch'] = updateMatch;
