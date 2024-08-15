class MapTile extends GameEntity
{
    static TYPES = {
        GEN_DOOR: -1,
        GEN_JUNCTION: -2,
        GEN_PATHWAY: -3,
        GEN_EXPANSION: -4,
        GEN_WALL: -5,
        EMPTY: 0,
        WALL: 2,
        FLOOR: 3,
        DOOR: 4,
        COLUMN: 5,
        REGULAR: 6,
        DEADEND: 7,
        SPAWN: 8,
        EXIT: 9,
        ENCOUNTER: 10,
        DISCOVERABLE: 11,
        JUNCTION: 12,
        POTENTIAL_JUNCTION: 13
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

    static generateEmptyMapTile(map, col, row)
    {
        return new MapTile(map, [col, row]);
    }

    constructor(map, data)
    {
        super(GameEntity.DESIGNATIONS.ROOM, `MapTile ${data[1]}, ${data[2]}`);

        this.map = map;

        const [col, row, status, type, variant, rarity, isOpen, isCorner, isNearDoor, isNearColumn] = data;

        this.col = (typeof col !== "undefined")? col: 0;
        this.row = (typeof row !== "undefined")? row: 0;
        this.status = (typeof status !== "undefined")? status: 0;
        this.type = (typeof type !== "undefined")? type: 0;
        this.variant = (typeof variant !== "undefined")? variant: 0;
        this.rarity = (typeof rarity !== "undefined")? rarity: 0;
        this.isOpen = (typeof isOpen !== "undefined")? isOpen: false;
        this.isCorner = (typeof isCorner !== "undefined")? isCorner: null;
        this.isNearDoor = (typeof isNearDoor !== "undefined")? isNearDoor: null;
        this.isNearColumn = (typeof isNearColumn !== "undefined")? isNearColumn: null;

        this.drawX = (this.col * this.map.renderer.outerDrawSize);
        this.drawY = (this.row * this.map.renderer.outerDrawSize);
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

    isAdjacentOfType(direction, type)
    {
        const neighbor = this.getNeighborByDirection(direction);

        if(neighbor === null) { return false; }

        return neighbor.type == type;
    }

    isConnected(direction)
    {
        const neighbor = this.getNeighborByDirection(direction);

        if(neighbor === null) { return false; }

        return neighbor.type != MapTile.TYPES.EMPTY;
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

        return this.map.getTile(row, col);
    }
}