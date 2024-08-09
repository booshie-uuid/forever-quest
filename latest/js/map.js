class DIRECTIONS
{
    static NORTH = "north";
    static EAST = "east";
    static SOUTH = "south";
    static WEST = "west";

    static NORTH_EAST = "north-east";
    static SOUTH_EAST = "south-east";
    static SOUTH_WEST = "south-west";
    static NORTH_WEST = "north-west";

    static getDirectionDeltas(direction)
    {
        switch (direction)
        {
            case DIRECTIONS.NORTH: return { x: 0, y: -1 };
            case DIRECTIONS.EAST: return { x: 1, y: 0 };
            case DIRECTIONS.SOUTH: return { x: 0, y: 1 };
            case DIRECTIONS.WEST: return { x: -1, y: 0 };
            case DIRECTIONS.NORTH_EAST: return { x: 1, y: -1 };
            case DIRECTIONS.SOUTH_EAST: return { x: 1, y: 1 };
            case DIRECTIONS.SOUTH_WEST: return { x: -1, y: 1 };
            case DIRECTIONS.NORTH_WEST: return { x: -1, y: -1 };
            default: return { x: 0, y: 0 };
        }
    }

    static getRandomDirection(chance)
    {
        const directions = [DIRECTIONS.NORTH, DIRECTIONS.EAST, DIRECTIONS.SOUTH, DIRECTIONS.WEST];
        const direction = chance.pick(directions);

        return direction;
    }
}

class Map
{
    static STATES = {
        UNKNOWN: 0,
        LOADING_DATA: 1,
        LOADING_TEXTURES: 2,
        GENERATING_MAP: 3,
        MAP_READY: 4
    }

    constructor(gfx, seed)
    {
        this.debug = true;

        this.gfx = gfx;
        this.chance = new SharedChance(seed);

        this.gridRows = 18;
        this.gridCols = 26;

        this.isReady = false;
        this.isDataReady = false;
        this.isTextureReady = false;
        this.isGridReady = false;
        this.isValid = false;

        this.grid = null;
        this.generator = new MapGenerator(this, this.chance);

        this.currentX = -1;
        this.currentY = -1;

        this.undefeatedRareEnemies = 0;
        this.maxRareEnemies = this.chance.range(6, 8);

        this.undefeatedEpicEnemies = 0;
        this.maxEpicEnemies = this.chance.range(2, 3);

        this.undefeatedLegendaryEnemies = 0;
        this.maxLegendaryEnemies = 1;

        this.undiscoveredRareTreasures = 0;
        this.maxRareTreasures = this.chance.range(4, 6);

        this.undiscoveredEpicTreasures = 0;
        this.maxEpicTreasures = this.chance.range(1, 2);

        this.undiscoveredLegendaryTreasures = 0;
        this.maxLegendaryTreasures = 1;

        this.remainingRareEnemies = this.chance.range(6, 8);
        this.remainingEpicEnemies = this.chance.range(2, 3);
        this.remainingLegendaryEnemies = 1; //this.chance.range(0, 1);

        this.remainingRareTreasures = this.chance.range(4, 6);
        this.remainingEpicTreasures = this.chance.range(1, 2);
        this.remainingLegendaryTreasures = this.chance.range(0, 1);

        this.state = Map.STATES.LOADING_DATA;

        this.biome = new Biome("elven-ruins-standard");

        this.texture = null;

        this.events = [];
    }

    update()
    {
        this.events = [];

        if(this.state == Map.STATES.MAP_READY)
        {
            // draw the map
            this.draw();
        }
        else if(this.state == Map.STATES.LOADING_DATA)
        {
            // check to see if the data is ready
            const isDataReady = this.biome.isReady;

            if(isDataReady)
            {
                this.events.push({type: "narrator-message", data: `Welcome to the ${this.biome.name}.`});

                this.texture = new GameTexture(`biomes/${this.biome.theme.spriteSheet}`);

                this.state = Map.STATES.LOADING_TEXTURES;
            }
        }
        else if(this.state == Map.STATES.LOADING_TEXTURES)
        {
            // check to see if the data is ready
            const areTexturesReady = this.texture.isReady;

            if(areTexturesReady)
            {
                this.state = Map.STATES.GENERATING_MAP;
            }
        }
        else if(this.state == Map.STATES.GENERATING_MAP)
        {
            // populate the grid if it has not already been done
            this.generator.generateRooms();
        }

        return this.events;
    }

    getCurrentRoom()
    {
        return this.getRoom(this.currentX, this.currentY);
    }

    getRoom(x, y)
    {
        if(x < 0 || x >= this.gridCols || y < 0 || y >= this.gridRows) return null;

        return new Room(this.grid[y][x]);
    }

    hasInvalidNeighbors(neighbors)
    {
        return neighbors.some(neighbor => neighbor === null || neighbor.type !== 0);
    }

    updateRoom(room)
    {
        this.grid[room.y][room.x] = room.compress();
    }

    getFeature(room)
    {
        // yeild if the room does not have a feature
        if(!Feature.containsFeature(room)) { return null; }

        const feature = this.biome.features.find(feature => feature.key == room.type);

        // yield if the feature is not found
        if(typeof feature === "undefined" || feature === null) { return null; }

        return feature;
    }

    getEncounter(room)
    {
        // yeild if the room does not have an encounter
        if(!Encounter.containsEncounter(room)) { return null; }

        let encounters = [];

        switch(room.type)
        {
            case Encounter.TYPES.ENEMY_COMMON: encounters = this.biome.commonEncounters; break;
            case Encounter.TYPES.ENEMY_RARE: encounters = this.biome.rareEncounters; break;
            case Encounter.TYPES.ENEMY_EPIC: encounters = this.biome.epicEncounters; break;
            case Encounter.TYPES.ENEMY_LEGENDARY: encounters = this.biome.legendaryEncounters; break;
            default: break;
        }

        const encounter = encounters.find(encounter => encounter.key == room.encounterKey);

        // yield if the encounter is not found
        if(typeof encounter === "undefined" || encounter === null) { return null; }

        return encounter;
    }

    exploreRoom(x, y)
    {
        const room = this.getRoom(x, y);

        if(room.status > 0) { return; } // already explored

        let roomTypes = [];

        if(room.type == 1)
        {    
            roomTypes = this.biome.commonRooms;
        }
        else if(room.type > 1)
        {
            roomTypes = this.biome.rareRooms;
        }

        let variant = 0; 
        
        if(this.chance.range(0, 10) < 8)
        {
            variant = (roomTypes.length > 0)? this.chance.range(0, roomTypes.length - 1): 0;
        }
        else
        {
            variant = (roomTypes.length > 1)? this.chance.range(0, 1): 0;
        }

        let encounterKeys = [];

        switch(room.type)
        {
            case Encounter.TYPES.ENEMY_COMMON: 
                encounterKeys = this.biome.commonEncounters.map(encounter => encounter.key); 
                break;

            case Encounter.TYPES.ENEMY_RARE: 
                encounterKeys = this.biome.rareEncounters.map(encounter => encounter.key); 
                break;

            case Encounter.TYPES.ENEMY_EPIC: 
                encounterKeys = this.biome.epicEncounters.map(encounter => encounter.key); 
                break;

            case Encounter.TYPES.ENEMY_LEGENDARY: 
                encounterKeys = this.biome.legendaryEncounters.map(encounter => encounter.key); 
                break;

            default: break;
        }

        const encounterKey = (encounterKeys.length > 0)? this.chance.pick(encounterKeys): 0;

        const northNeighbor = this.getRoom(x, y - 1);
        const eastNeighbor = this.getRoom(x + 1, y);
        const southNeighbor = this.getRoom(x, y + 1);
        const westNeighbor = this.getRoom(x - 1, y);

        const hasNorthDoor = (northNeighbor !== null && northNeighbor.type != 0)? true: false;
        const hasEastDoor = (eastNeighbor !== null && eastNeighbor.type != 0)? true: false;
        const hasSouthDoor = (southNeighbor !== null && southNeighbor.type!= 0)? true: false;
        const hasWestDoor = (westNeighbor !== null && westNeighbor.type != 0)? true: false;
        
        room.status = 1; // 1 = explored
        room.variant = variant;
        room.encounterKey = encounterKey;
        room.hasNorthDoor = hasNorthDoor;
        room.hasEastDoor = hasEastDoor;
        room.hasSouthDoor = hasSouthDoor;
        room.hasWestDoor = hasWestDoor;

        this.updateRoom(room);

        const events = [];
        const loot = [];

        let encounter = this.getEncounter(room);

        if(encounter !== null)
        {
            const flavors = ["whooped", "walloped", "man-handled", "sucker-punched"];
            let tag = "COMMON";

            switch(room.type)
            {
                case 101: tag = "RARE"; break;
                case 102: tag = "EPIC"; break;
                case 103: tag = "LEGENDARY"; break;
                default: break;
            }

            const message = `You have ${this.chance.pick(flavors)} a [${tag}][${encounter.name}][/${tag}]!`;

            events.push({type: "narrator-message", data: message});

            const encounterLoot = this.biome.determineLoot(encounter, this.chance);
            loot.push(...encounterLoot);
        }

        const feature = this.getFeature(room);

        if(feature !== null && feature.isLootable)
        {
            const featureLoot = this.biome.determineLoot(feature, this.chance);
            loot.push(...featureLoot);
        }

        for(const item of loot)
        {
            let flavor = "Nice!";
            let tag = item.rarity.toUpperCase();

            switch(tag)
            {
                case "COMMON": flavor = "Lame..."; break;
                case "RARE": flavor = "Nice! "; break;
                case "EPIC": flavor = "Oh Snap..."; break;
                case "LEGENDARY": flavor = "Holy Shit"; break;
                default: flavor = "Huh?"; break;
            }

            const message = `${flavor} You looted a [${tag}][${item.name}][/${tag}]!`;

            events.push({type: "narrator-message", data: message});
        }

        if(feature !== null && feature.isExit)
        {
            events.push({type: "narrator-message", data: "[LEGENDARY]You reached the end! Go you![/LEGENDARY]"});
        }

        return events;
    }

    drawFeature(room, drawX, drawY)
    {
        const feature = this.getFeature(room);

        // yeild if the feature could not be found
        if(feature == null) { return; }

        const spriteX = feature.spriteX;
        const spriteY = feature.spriteY;

        this.gfx.drawSprite(this.texture, spriteX, spriteY, drawX + 1, drawY + 1, 36, 36);
    }

    drawEncounter(room, drawX, drawY)
    {
        const encounter = this.getEncounter(room);

        // yield if the encounter is not found
        if(encounter === null) { return; }

        const spriteX = encounter.spriteX;
        const spriteY = encounter.spriteY;
        const spriteOffsetX = (typeof encounter.spriteOffsetX !== "undefined" && encounter.spriteOffsetX != null)? encounter.spriteOffsetX: 0;
        const spriteOffsetY = (typeof encounter.spriteOffsetY !== "undefined" && encounter.spriteOffsetY != null)? encounter.spriteOffsetY: 0;

        this.gfx.drawSprite(this.texture, spriteX, spriteY, drawX + 3 + spriteOffsetX, drawY - 8 + spriteOffsetY);
    }
    
    drawRoom(room)
    {
        const w = 38;
        const h = 38;
        const drawX = room.x * w;
        const drawY = room.y * h;

        const northNeighbor    = this.getRoom(room.x, room.y - 1);
        const eastNeighbor    = this.getRoom(room.x + 1, room.y);
        const southNeighbor    = this.getRoom(room.x, room.y + 1);
        const westNeighbor    = this.getRoom(room.x - 1, room.y);
        
        if(northNeighbor !== null && northNeighbor.type != 0 && northNeighbor.status == 0) { this.drawRoomShadow(northNeighbor); }
        if(eastNeighbor !== null && eastNeighbor.type != 0 && eastNeighbor.status == 0) { this.drawRoomShadow(eastNeighbor); }
        if(southNeighbor !== null && southNeighbor.type != 0 && southNeighbor.status == 0) { this.drawRoomShadow(southNeighbor); }
        if(westNeighbor !== null && westNeighbor.type != 0 && westNeighbor.status == 0) { this.drawRoomShadow(westNeighbor); }

        const wallColor = (this.currentX == room.x && this.currentY == room.y)? "#fab40b": this.biome.theme.backgroundColor;

        this.gfx.drawRectangle(drawX, drawY, 38, 38, wallColor);

        let roomTypes = [];

        if(room.type == 1)
        {    
            roomTypes = this.biome.commonRooms;
        }
        else if(room.type > 1)
        {
            roomTypes = this.biome.rareRooms;
        }

        const roomData = roomTypes[room.variant];

        // yeild if no data can be found about the room type
        if(roomData === null) { return; }

        this.gfx.drawSprite(this.texture, roomData.spriteX, roomData.spriteY, drawX + 1, drawY + 1, 36, 36);

        this.drawEncounter(room, drawX, drawY);
        this.drawFeature(room, drawX, drawY);
    }

    drawRoomShadow(room)
    {
        if(this.debug) { return; }

        const w = 38;
        const h = 38;
        const drawX = room.x * w;
        const drawY = room.y * h;

        const floorColor = this.biome.theme.roomShadowColor;
        const wallColor = this.biome.theme.backgroundColor;

        this.gfx.drawRectangle(drawX, drawY, 36, 36, wallColor);
        this.gfx.drawRectangle(drawX + 1, drawY + 1, 36, 36, floorColor);
    }

    draw()
    {
        this.gfx.fillBackground(this.biome.theme.backgroundColor);

        for(let gridY = 0; gridY < this.gridRows; gridY++)
        {    
            for(let gridX = 0; gridX < this.gridCols; gridX++)
            {
                const room = this.getRoom(gridX, gridY);

                if(room === null || room.type == 0 || (!this.debug && room.status == 0)) { continue; }

                this.drawRoom(room);
            }
        }
    }
}