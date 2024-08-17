class MapTile
{
    static TYPES = {
        DEBUG: -666,
        GEN_DOOR: -1,
        GEN_JUNCTION: -2,
        GEN_PATHWAY: -3,
        GEN_EXPANSION: -4,
        GEN_WALL: -5,
        EMPTY: 0,
        WALL: 2,
        FLOOR: 3,
        WATER: 4,
        DOOR: 5,
        SPECIAL: 6,
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

    static generateEmptyMapTile(parentMap, col, row)
    {
        return new MapTile(parentMap, [col, row]);
    }

    constructor(parentMap, data = [])
    {
        this.parent = parentMap;

        const [col, row, status, type, variant, rarity, brightness, isOpen, isCorner, isNearDoor, isNearColumn] = data;

        this.col = (typeof col !== "undefined")? col: 0;
        this.row = (typeof row !== "undefined")? row: 0;
        this.status = (typeof status !== "undefined")? status: 0;
        this.type = (typeof type !== "undefined")? type: 0;
        this.variant = (typeof variant !== "undefined")? variant: 0;
        this.rarity = (typeof rarity !== "undefined")? rarity: 0;
        this.brightness = (typeof brightness !== "undefined")? brightness: 0.0;
        this.previousBrightness = this.brightness;
        this.isOpen = (typeof isOpen !== "undefined")? isOpen: false;
        this.isCorner = (typeof isCorner !== "undefined")? isCorner: null;
        this.isNearDoor = (typeof isNearDoor !== "undefined")? isNearDoor: null;
        this.isNearColumn = (typeof isNearColumn !== "undefined")? isNearColumn: null;
        this.isTransparent = false;
        this.isNonVariant = false;
        this.isTileHorizontal = null;
        this.isRevealed = false;
        this.proposedBrightness = 0.0;
        this.symbol = null;
        this.isTraversable = false;

        this.renderX = (this.col * this.parent.renderer.outerDrawSize);
        this.renderY = (this.row * this.parent.renderer.outerDrawSize);
    }

    isHorizontal()
    {
        if(this.isTileHorizontal !== null) { return this.isTileHorizontal; }
        
        const neighbor = this.getNeighborByDirection(DIRECTIONS.SOUTH);

        this.isTileHorizontal = (neighbor === null || (neighbor.type !== MapTile.TYPES.WALL && neighbor.type !== MapTile.TYPES.DOOR));

        return this.isTileHorizontal;
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

    setType(type)
    {
        this.type = type;

        const traversableTypes = [MapTile.TYPES.FLOOR, MapTile.TYPES.DOOR, MapTile.TYPES.SPECIAL];
        this.isTraversable = traversableTypes.includes(type);

        if(this.type == MapTile.TYPES.SPECIAL && ["A", "B", "C"].includes(this.symbol))
        {
            this.isTraversable = false;
        }

        const transparentTypes = [MapTile.TYPES.DOOR, MapTile.TYPES.SPECIAL];
        this.isTransparent = transparentTypes.includes(type);

        const nonVariantTypes = [MapTile.TYPES.DOOR];
        this.isNonVariant = (nonVariantTypes.includes(type))? true : this.isNonVariant;

        if(this.type == MapTile.TYPES.DOOR)
        {
            this.variant = (this.isOpen)? 1 : 0;
        }
    }

    getRenderVariant()
    {
        let variant = this.variant;

        if(this.type == MapTile.TYPES.DOOR)
        {
            variant = (this.isOpen)? 1 : 0;
        }
        else if(this.type == MapTile.TYPES.WALL && variant > 7 && !this.isHorizontal())
        {
            variant = variant - 8;
        }

        return variant;
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

        return this.parent.getTile(row, col);
    }
}