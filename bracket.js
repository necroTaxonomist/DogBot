
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
async function createTournament( name, url )
{
    let tournament =
    {
        name: name,
        tournament_type: 'double elimination'
    };

    if ( url )
    {
        tournament.url = url;
    }

    const wrapper =
        ( callback ) =>
        {
            let obj =
            {
                tournament: tournament,
                callback: callback
            };
            client.tournaments.create( obj );
        };

    const prom = util.promisify( wrapper );
    
    try
    {
        const result = await prom();
        return result;
    }
    catch ( ex )
    {
        return ex;
    }
}
module.exports['createTournament'] = createTournament;

async function createParticipant( url, name, misc )
{
    let participant =
    {
        name: name
    };

    if ( misc )
    {
        participant.misc = misc;
    }

    const wrapper =
        ( callback ) =>
        {
            let obj =
            {
                id: url,
                participant: participant,
                callback: callback
            };
            client.participants.create( obj );
        };

    const prom = util.promisify( wrapper );
    
    try
    {
        const result = await prom();
        return result;
    }
    catch ( ex )
    {
        return ex;
    }
}
module.exports['createParticipant'] = createParticipant;
