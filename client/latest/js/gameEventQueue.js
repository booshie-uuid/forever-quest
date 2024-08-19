class GameEventQueue
{
    constructor()
    {
        this.events = [];
    }

    enqueue(event)
    {
        this.events.push(event);
    }

    dequeue(types)
    {
        // get events of the specified types
        const filteredEvents = this.events.filter(event => types.includes(event.type));

        // remove events of the specified types from the queue
        this.events = this.events.filter(event => !types.includes(event.type));

        return filteredEvents;
    }

    dequeueAll()
    {
        // get all events in the queue
        const events = this.events;

        // remove all events from the queue
        this.events = [];
        
        return events;
    }

    clear()
    {
        this.events = [];
    }
}

// global instance
const GEQ = new GameEventQueue();