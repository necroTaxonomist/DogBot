
//-------
// Setup
//-------

const { JWT } = require('google-auth-library');

const creds = require('./google.json');

const GOOGLE_AUTH_SCOPES =
[
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
];

//-----------
// Variables
//-----------
let jwtClient = null;

//-----------
// Functions
//-----------
async function auth()
{
    if ( jwtClient === null )
    {
        let clientSettings =
        {
            email: creds.client_email,
            key: creds.private_key,
            scopes: GOOGLE_AUTH_SCOPES,
            subject: null
        };
        jwtClient = new JWT( clientSettings );

        await jwtClient.authorize();
    }

    return jwtClient;
}
module.exports['auth'] = auth;
