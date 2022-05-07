
//-------
// Setup
//-------
const creds = require('./google.json');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const RECORDS_DOC = '15CaPqS336nRA6qiEbC6tpXDZW8LbwEvsNdFUv_vEwLA';

//-----------
// Functions
//-----------
async function getRecords()
{
    // Retrieve the doc by ID
    let doc = new GoogleSpreadsheet( RECORDS_DOC );

    // Authenticate
    await doc.useServiceAccountAuth( creds );

    // Retreive information
    await doc.loadInfo();
    console.log( 'Retrieved document called ' + doc.title );

    return doc;
}

async function getRankings( count )
{
    // Load the required data
    let doc = await getRecords();
    let sheet = doc.sheetsByIndex[0];
    await sheet.loadCells('O3:Q' + (count + 2));

    // Read the data
    let data = new Array(count);
    for ( let i = 0; i < count; ++i )
    {
        let rankCell = sheet.getCellByA1( 'O' + (i + 3) );
        let nameCell = sheet.getCellByA1( 'P' + (i + 3) );
        let winsCell = sheet.getCellByA1( 'Q' + (i + 3) );

        data[i] =
        {
            rank: rankCell.value,
            name: nameCell.value,
            wins: winsCell.value
        };
    }

    return data;
}
module.exports['getRankings'] = getRankings;
