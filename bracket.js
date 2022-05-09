
//-------
// Setup
//-------
const { challongeApiKey } = require( './config.json' );
const challonge = require( 'challonge' );
const StrExt = require( './strext' );

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

async function findParticipantWithName( url, name )
{
    name = StrExt.removeEmojis( name );

    let participants = await indexParticipants( url );
    if ( participants.error )
    {
        return participants;
    }

    for ( let i = 0; /*in loop*/; ++i )
    {
        let item = participants[i];
        if ( !item )
        {
            let error =
            {
                error: true,
                text: "No open participants matching name"
            };
            return error;
        }

        let participant = item.participant;

        if ( name == StrExt.removeEmojis( participant.name ) )
        {
            return participant;
        }
    }
}
module.exports['findParticipantWithName'] = findParticipantWithName;

async function findParticipantWithId( url, id )
{
    let participants = await indexParticipants( url );
    if ( participants.error )
    {
        return participants;
    }

    for ( let i = 0; /*in loop*/; ++i )
    {
        let item = participants[i];
        if ( !item )
        {
            let error =
            {
                error: true,
                text: "No open participants matching ID"
            };
            return error;
        }

        let participant = item.participant;

        if ( id == participant.id )
        {
            return participant;
        }
    }
}
module.exports['findParticipantWithId'] = findParticipantWithId;

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

async function findOpenMatchWithParticipant( url, id )
{
    let matches = await indexMatches( url );
    if ( matches.error )
    {
        return matches;
    }

    for ( let i = 0; /*in loop*/; ++i)
    {
        let item = matches[i];
        if ( !item )
        {
            let error =
            {
                error: true,
                text: "No open matches containing player"
            };
            return error;
        }

        let match = item.match;

        if ( match.state != 'open' )
        {
            // Not an open match
            continue;
        }

        if ( match.player1Id == id || match.player2Id == id )
        {
            return match;
        }
    }
}
module.exports['findOpenMatchWithParticipant'] = findOpenMatchWithParticipant;
