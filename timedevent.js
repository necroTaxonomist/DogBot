
class TimedEvent
{
    static instances = new Set();

    /**
     *
     */
    constructor()
    {
        this.active = false;
        this.message = null;
    }

    /**
     *
     */
    async start( interaction, endTime )
    {
        // Subclasses should override this
        this.activate( null, endTime );
    }

    /**
     * 
     */
    async startByReply( message, endTime )
    {
        // Subclasses should override this
        this.activate( null, endTime );
    }

    /**
     *
     */
    async run()
    {
        // Subclasses should override this
    }

    /**
     *
     */
    async onReaction( reaction, user )
    {
        // Subclasses should override this
    }

    /**
     * 
     */
    async finishEarly()
    {
        await this.run();
        this.deactivate();
    }

    /**
     * 
     */
    activate( message, endTime )
    {
        this.active = true;
        TimedEvent.instances.add( this );
        this.message = message;
        this.startTime = new Date();
        this.endTime = endTime;
        this.duration = this.endTime - this.startTime;

        setTimeout(
            async () =>
            {
                if ( !this.active )
                {
                    // Already ran
                    return;
                }

                // Run asynchronously
                await this.run();

                // Deactivate
                this.deactivate();
            },
            this.duration
        );
        console.log( 'Set a timeout for ' + this.duration + ' milliseconds');
    }

    /**
     *
     */
    deactivate()
    {
        this.active = false;
        TimedEvent.instances.delete( this );
    }

    /**
     *
     */
    static async postReaction( reaction, user )
    {
        for ( let i of TimedEvent.instances )
        {
            if ( reaction.message.id == i.message.id )
            {
                i.onReaction( reaction, user );
            }
        }
    }
}
module.exports = TimedEvent;
