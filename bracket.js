
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
// Constants
//-----------

const NAME_FORMAT = /(\p{Emoji})?\s*(\w+)\s*(?:\((.*)\))?/u;
module.exports['NAME_FORMAT'] = NAME_FORMAT;

//-----------
// Functions
//-----------
function separateName( fullName, defaultEmoji = null )
{
    let match = fullName.match( NAME_FORMAT );
    let result =
    {
        fullName: fullName,
        emoji: match[1] ?? defaultEmoji,
        origEmoji: match[1],
        nameOnly: match[2].trim(),
        source: match[3]
    };

    if ( result.source )
    {
        result.source = result.source.trim();
        result.name = result.nameOnly + ' (' + result.source + ')';
    }
    else
    {
        result.name = result.nameOnly;
    }

    return result;
}
module.exports['separateName'] = separateName;

async function runAction( action, obj )
{
    const wrapper =
        ( obj, callback) =>
        {
            obj.callback = callback;
            action( obj );
        };

    const prom = util.promisify( wrapper );

    let result = await prom( obj );
    return result;
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

async function indexTournaments()
{
    let obj = {};

    let tournaments = await runAction( o => client.tournaments.index( o ), obj );

    let array = new Array();

    for ( let i = 0; /*in loop*/; ++i )
    {
        let item = tournaments[i];
        if ( !item )
        {
            // Reached the end
            break;
        }

        array.push( item.tournament );
    }

    return array;
}
module.exports['indexTournaments'] = indexTournaments;

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

    let participants = await runAction( o => client.participants.index( o ), obj );

    let array = new Array();

    for ( let i = 0; /*in loop*/; ++i )
    {
        let item = participants[i];
        if ( !item )
        {
            // Reached the end
            break;
        }

        array.push( item.participant );
    }

    return array;
}
module.exports['indexParticipants'] = indexParticipants;

async function findParticipantWithName( url, name )
{
    let participants = await indexParticipants( url );
    
    console.log( name );
    let participant = participants.find(
        p =>
        {
            let sep = separateName( p.name );
            console.log( sep );
            return sep.fullName == name || sep.nameOnly == name || sep.name == name;
        }
    );

    if ( participant == undefined )
    {
        throw 'No participants matching name';
    }

    return participant;
}
module.exports['findParticipantWithName'] = findParticipantWithName;

async function findParticipantWithId( url, id )
{
    let participants = await indexParticipants( url );
    
    let participant = participants.find( p => p.id == id );

    if ( participant == undefined )
    {
        throw 'No participants matching ID';
    }

    return participant;
}
module.exports['findParticipantWithId'] = findParticipantWithId;

async function indexMatches( url )
{
    let obj =
    {
        id: url
    };

    let matches = await runAction( o => client.matches.index( o ), obj );

    let array = new Array();

    for ( let i = 0; /*in loop*/; ++i )
    {
        let item = matches[i];
        if ( !item )
        {
            // Reached the end
            break;
        }

        array.push( item.match );
    }

    return array;
}
module.exports['indexMatches'] = indexMatches;

async function reportMatch( url, matchId, score, winnerId )
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
module.exports['reportMatch'] = reportMatch;

async function startMatch( url, matchId )
{
    let obj =
    {
        path: '/' + client.matches.options.get('subdomain') + url + '/matches/' + matchId + '/mark_as_underway',
        method: 'PUT'
    }

    try
    {
        await runAction( o => client.matches.makeRequest( o ), obj );
    }
    catch ( ex )
    {
        console.log( ex );
    }
}
module.exports['startMatch'] = startMatch;

async function findOpenMatchWithParticipant( url, id )
{
    let matches = await indexMatches( url );
    let match = matches.find(
        m =>
        {
            return m.state == 'open' && (m.player1Id == id || m.player2Id == id);
        }
    );

    if ( match == undefined )
    {
        throw 'No open matches containing player';
    }

    return match;
}
module.exports['findOpenMatchWithParticipant'] = findOpenMatchWithParticipant;
