
//-------
// Setup
//-------
const { google } = require('googleapis');
const GoogleAuth = require( './googleauth' );

const fs = require('fs');
const glob = require('glob');

const util = require('util');

const IMAGE_DIR = './images';

//-----------
// Variables
//-----------
let drive = null;

let cache = new Map();

//-----------
// Functions
//-----------
async function getDrive()
{
    if ( drive === null )
    {
        drive = google.drive( 'v3' );
        authClient = await GoogleAuth.auth();
        google.options({auth: authClient});
    }

    return drive;
}

async function fetchFileById( fileId )
{
    console.log( 'Fetching file ' + fileId + '...' );

    let req =
    {
        fileId: fileId,
        alt: 'media'
    };

    if ( drive === null )
    {
        await getDrive();
    }

    let res = await drive.files.get( req, { responseType: 'stream' } );
    
    let fn = IMAGE_DIR + '/' + fileId;
    if ( res.headers['content-type'] == 'image/jpeg' )
        fn += '.jpg';
    else if ( res.headers['content-type'] == 'image/png' )
        fn += '.png';
    else if ( res.headers['content-type'] == 'image/webp' )
        fn += '.webp';
    else
    {
        console.log( 'Unrecognized content type ' + res.headers['content-type'] );
        return null;
    }

    let dest = fs.createWriteStream( fn );
    res.data.pipe( dest );

    let prom = new Promise(
        ( resolve, reject ) =>
        {
            res.data.on( 'end', resolve );
            res.data.on('error', reject );
        }
    );
    await prom;

    dest.close();

    return fn;
}

async function getFileByUrl( url )
{
    let re = /id=([\w-]+)/;
    let res = url.match( re );
    let id = res[1];
    return await getFileById( id );
}
module.exports['getFileByUrl'] = getFileByUrl;

async function getFileById( fileId )
{
    let fnPattern = IMAGE_DIR + '/' + fileId + '.*';

    let prom = util.promisify( glob );
    let matches = await prom( fnPattern );

    if ( matches != null && matches[0] != null )
    {
        console.log( 'Found cached file ' + matches[0] );
        return matches[0];
    }

    let fn = await fetchFileById( fileId );

    if ( fn != null )
    {
        cache.set( fileId, fn );
    }

    return fn;
}
module.exports['getFileById'] = getFileById;