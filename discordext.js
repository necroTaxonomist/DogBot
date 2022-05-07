
function getName( member )
{
    return member.nickname ?? member.user.username;
}
module.exports['getName'] = getName;

function getRole( interaction, name )
{
    return interaction.guild.roles.cache.find( r => r.name === name );
}
module.exports['getRole'] = getRole;

function getMembersWithRole( interaction, roleName )
{
    // Get the role struct
    let role = getRole( interaction, roleName );

    // Get all members with that role
    return role.members.map( m => m );
}
module.exports['getMembersWithRole'] = getMembersWithRole;

async function getMessagesSince( channel, sinceDate )
{
    let found = [];

    // Keep searching until a message before the date is found
    let options = { limit : 50 };
    for (;;)
    {
        // Run the query
        let results = await channel.messages.fetch( options );
        results = Array.from( results.values() );  // Convert to array because fuck everything thfofjzdfsnunosidthgsrdzjerompwdfxih8vctxwqj;oc hyw8c 

        if ( !results )
        {
            // No more results
            break;
        }

        // Find the earliest message
        let earliest = null;
        for ( let m of results )
        {
            if ( earliest === null || m.createdTimestamp < earliest.createdTimestamp )
            {
                earliest = m;
            }
        }

        // Set the next query to look before the earliest message
        options.before = earliest.id;

        // Add to the list of found messages
        found = found.concat( results );

        if ( earliest.createdAt < sinceDate )
        {
            // No need to go further
            break;
        }
    }

    // Return messages after the given date
    return found.filter( m => m.createdAt >= sinceDate );
}
module.exports['getMessagesSince'] = getMessagesSince;