class GameEvent
{
    static TYPES = {
        UNKNOWN: 0,
        ERROR: 1,
        WARNING: 2,
        DIAGNOSTIC: 3,
        SPECIAL: 4,
        MESSAGE: 5,
        MAP: 6,
        ACTION: 7,
        ENCOUNTER: 8,
        DISCOVERY: 9
    };

    static getSourceDisplayName(source)
    {
        return Object.keys(GameEvent.SOURCES).find(key => GameEvent.SOURCES[key] === source);
    }

    constructor(type, source, data)
    {
        this.type = type;
        this.source = source;
        this.data = data;
    }

    on(event, callback)
    {
        if (!this.events[event]) {
            this.events[event] = [];
        }

        this.events[event].push(callback);
    }

    trigger(event, data)
    {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                callback(data);
            });
        }
    }
}