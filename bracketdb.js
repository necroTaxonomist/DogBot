
//-------
// Setup
//-------
const GoogleAuth = require( './googleauth' );

const { GoogleSpreadsheet } = require('google-spreadsheet');
const ImageDb = require( './imagedb' )

const RESPONSES_DOC = '1RXs6yaF5KwiuwdOsJ_7StoXBhviR9eO0HgPQfQ3FeDE';

//-----------
// Variables
//-----------
const responses = new Array();

//-----------
// Functions
//-----------
async function fetchResponses()
{
    // Retrieve the doc by ID
    let doc = new GoogleSpreadsheet( RESPONSES_DOC );

    // Authenticate
    doc.jwtClient = await GoogleAuth.auth();
    doc.authMode = 'JWT';

    // Retrieve the document information
    await doc.loadInfo();
    console.log( 'Retrieved document called ' + doc.title );

    // Get the first sheet
    let sheet = doc.sheetsByIndex[0];

    // Clear the cached responses
    responses.length = 0;

    for ( let row = 2; /*in loop*/; ++row )
    {
        let response = await fetchResponse( sheet, row );
        if ( response !== null )
        {
            // Get the images for each
            for ( let entry of response.entries )
            {
                entry.image = await ImageDb.getFileByUrl( entry.imgUrl );
            }

            responses.push( response );
        }
        else
        {
            break;
        }
    }

    return responses;
}

async function fetchResponse( sheet, row )
{
    // Load the required data
    await sheet.loadCells('A' + row + ':R' + row);

    if ( !sheet.getCellByA1( 'A' + row ).value )
    {
        // No row data
        return null;
    }

    // Create a response struct
    let response =
    {
        timestamp: sheet.getCellByA1( 'A' + row ).value,
        sponsor: sheet.getCellByA1( 'B' + row ).value,
        entries:
        [
            {
                name: sheet.getCellByA1( 'C' + row ).value,
                source: sheet.getCellByA1( 'D' + row ).value,
                imgUrl: sheet.getCellByA1( 'E' + row ).value,
                emoji: sheet.getCellByA1( 'F' + row ).value,
            },
            {
                name: sheet.getCellByA1( 'G' + row ).value,
                source: sheet.getCellByA1( 'H' + row ).value,
                imgUrl: sheet.getCellByA1( 'I' + row ).value,
                emoji: sheet.getCellByA1( 'J' + row ).value,
            },
            {
                name: sheet.getCellByA1( 'K' + row ).value,
                source: sheet.getCellByA1( 'L' + row ).value,
                imgUrl: sheet.getCellByA1( 'M' + row ).value,
                emoji: sheet.getCellByA1( 'N' + row ).value,
            },
            {
                name: sheet.getCellByA1( 'O' + row ).value,
                source: sheet.getCellByA1( 'P' + row ).value,
                imgUrl: sheet.getCellByA1( 'Q' + row ).value,
                emoji: sheet.getCellByA1( 'R' + row ).value,
            }
        ]
    };

    return response;
}

async function indexResponses( )
{
    if ( responses.length == 0 )
    {
        await fetchResponses();
    }

    return responses;
}
module.exports['indexResponses'] = indexResponses;

async function getResponse( id )
{
    if ( responses.length == 0 )
    {
        await fetchResponses();
    }

    return responses[id];
}
module.exports['getResponse'] = getResponse;

async function findEntry( name, source, emoji )
{
    let responses = await indexResponses();

    for ( let response of responses )
    {
        for ( let entry of response.entries )
        {
            if ( entry.name != name )
                continue;
            
            if ( source && entry.source != source)
                continue;
            
            if ( emoji && entry.emoji != emoji )
                continue;
            
            return entry;
        }
    }

    return null;
}
module.exports['findEntry'] = findEntry;