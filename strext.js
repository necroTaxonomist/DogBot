
const DOG_NOISES = [ 'Woof!', 'Arf!', 'Bow-wow!', 'Ruff!', 'Bark!' ];
function randomDogNoise()
{
    return DOG_NOISES[Math.floor( Math.random() * DOG_NOISES.length )];
}
module.exports['randomDogNoise'] = randomDogNoise;

function oxfordComma( inputs )
{
    let output = '';

    for ( let i in inputs )
    {
        if ( i == 0 )
        {
            // Nothing before the first item
        }
        else if ( i == inputs.length - 1 )
        {
            if ( inputs.length > 2 )
            {
                output += ', and ';
            }
            else
            {
                output += ' and ';
            }
        }
        else
        {
            output += ', ';
        }

        output += inputs[i];
    }

    return output;
}
module.exports['oxfordComma'] = oxfordComma;

function isEmoji( c )
{
    const emojiRegex = /\p{Emoji}/u;
    return emojiRegex.test( c );
}
module.exports['isEmoji'] = isEmoji;

function removeEmojis( str )
{
    return str.replaceAll( /\p{Emoji}/ug, '' );
}
module.exports['removeEmojis'] = removeEmojis;
