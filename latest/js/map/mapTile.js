class MapTile
{
    static TILE_SIZE = 32;

    static TYPES = {
        DEBUG: -666,
        GEN_DOOR: -1,
        GEN_JUNCTION: -2,
        GEN_PATHWAY: -3,
        GEN_EXPANSION: -4,
        GEN_WALL: -5,
        EMPTY: 0,
        WALL: 1,
        FLOOR: 2,
        WATER: 3,
        DOOR: 4,
        SPECIAL: 5,
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

        const [col, row, status, type, variant, rarity, brightness, isActivated, isCorner, isNearDoor, isNearColumn] = data;

        this.col = (typeof col !== "undefined")? col: 0;
        this.row = (typeof row !== "undefined")? row: 0;
        this.status = (typeof status !== "undefined")? status: 0;
        this.type = (typeof type !== "undefined")? type: 0;
        this.variant = (typeof variant !== "undefined")? variant: 0;
        this.rarity = (typeof rarity !== "undefined")? rarity: 0;

        this.spritePositions = { baseCol: null, baseRow: null, overlayCol: null, overlayRow: null };

        // properties used for calculating and displaying fog of war
        this.brightness = (typeof brightness !== "undefined")? brightness: 0.0;
        this.previousBrightness = this.brightness;
        this.proposedBrightness = 0.0;
        
        this.isRevealed = false;
        this.isActivated = (typeof isActivated !== "undefined")? isActivated: false;

        this.canHideOverlays = true;

        // cached results of calculated checks
        this.checkResults = {
            isHorizontal: null
        }
        
        
        this.symbol = null;
        this.isTraversable = false;

        this.renderX = (this.col * this.parent.renderer.outerDrawSize);
        this.renderY = (this.row * this.parent.renderer.outerDrawSize);
    }

    clearCheckResults()
    {
        this.checkResults = {
            isHorizontal: null
        };
    }

    isEmpty(x, y)
    {
        return (this.type == 0);
    }

    isHorizontal()
    {
        if(this.checkResults.isHorizontal !== null) { return this.checkResults.isHorizontal; }
        
        const neighbor = this.getNeighborByDirection(DIRECTIONS.SOUTH);

        this.checkResults.isHorizontal = (neighbor === null || (neighbor.type !== MapTile.TYPES.WALL && neighbor.type !== MapTile.TYPES.DOOR));

        return this.checkResults.isHorizontal;
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

        if(this.type == MapTile.TYPES.DOOR)
        {
            this.variant = (this.isActivated)? 1 : 0;
        }

        this.spritePositions.baseCol = this.getRenderVariant();
        this.spritePositions.baseRow = this.type;
    }

    getRenderVariant()
    {
        let variant = this.variant;

        if(this.type == MapTile.TYPES.DOOR)
        {
            variant = (this.isActivated)? 1 : 0;
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