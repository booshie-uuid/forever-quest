class Room extends GameEntity
{
    static TYPES = {
        EMPTY: 0,
        REGULAR: 1,
        DEADEND: 2,
        SPAWN: 3,
        EXIT: 4,
        ENCOUNTER: 5,
        DISCOVERABLE: 6
    }

    static RARITY = {
        UNKNOWN: "unknown",
        COMMON: "common",
        UNCOMMON: "uncommon",
        RARE: "rare",
        EPIC: "epic",
        LEGENDARY: "legendary",
        SPECIAL: "special"
    };

    static generateEmptyRoom(map, col, row)
    {
        return new Room(map, [col, row]);
    }

    constructor(map, data)
    {
        super(GameEntity.DESIGNATIONS.ROOM, `Room ${data[1]}, ${data[2]}`);

        this.map = map;

        const [col, row, status, type, variant, rarity, childKey, hasNorthDoor, hasEastDoor, hasSouthDoor, hasWestDoor] = data;

        this.col = (typeof col !== "undefined")? col: 0;
        this.row = (typeof row !== "undefined")? row: 0;
        this.status = (typeof status !== "undefined")? status: 0;
        this.type = (typeof type !== "undefined")? type: 0;
        this.variant = (typeof variant !== "undefined")? variant: 0;
        this.rarity = (typeof rarity !== "undefined")? rarity: 0;
        this.childKey = (typeof childKey !== "undefined")? childKey: null;

        this.hasNorthDoor = (typeof hasNorthDoor !== "undefined")? hasNorthDoor == 1: false;
        this.hasEastDoor = (typeof hasEastDoor !== "undefined")? hasEastDoor == 1: false;
        this.hasSouthDoor = (typeof hasSouthDoor !== "undefined")? hasSouthDoor == 1: false;
        this.hasWestDoor = (typeof hasWestDoor !== "undefined")? hasWestDoor == 1: false;

        this.drawX = (this.col * 38);
        this.drawY = (this.row * 38);
    }

    compress()
    {
        // get all data fields (excluding inherited and calculated fields)
        const { designation, name, map, drawX, drawY, ...rest } = this;
    
        return Object.values(rest);
    }

    isEmpty(x, y)
    {
        return (this.type == 0);
    }

    isConnected(direction)
    {
        const neighbor = this.getNeighborByDirection(direction);

        if(neighbor === null) { return false; }

        return neighbor.type != Room.TYPES.EMPTY;
    }

    getNeighborsByDirection(directions)
    {
        const neighbors = [];

        for(const direction of directions)
        {
            const neighbor = this.getNeighborByDirection(direction);

            if(neighbor !== null) { neighbors.push(neighbor); }
        }

        return neighbors;
    }

    getNeighborByDirection(direction)
    {
        const deltas = DIRECTIONS.getDirectionDeltas(direction);

        if(deltas === null) { return null; }

        const row = this.col + deltas.col;
        const col = this.row + deltas.row;

        return this.map.getRoom(row, col);
    }
}