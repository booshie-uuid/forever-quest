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
        // key dependencies
        this.gfx = gfx;
        this.chance = new SharedChance(seed);
        this.biome = new Biome("elven-ruins-standard");
        this.generator = new MapGenerator(this, this.chance);
        this.texture = null;
        this.events = [];

        // map state and other important flags
        this.state = Map.STATES.LOADING_DATA;

        // map grid and grid properties
        this.grid = null;

        this.gridRows = 15;
        this.gridCols = 25;
        
        this.currentCol = -1;
        this.currentRow = -1;

        // encounter and feature properties
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
        return this.getRoom(this.currentCol, this.currentRow);
    }

    getRoom(x, y)
    {
        if(x < 0 || x >= this.gridCols || y < 0 || y >= this.gridRows) return null;

        return new Room(this, this.grid[y][x]);
    }

    updateRoom(room)
    {
        this.grid[room.row][room.col] = room.compress();
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
       
        room.status = 1; // 1 = explored
        room.variant = variant;
        room.encounterKey = encounterKey;
        room.hasNorthDoor = room.isConnected(DIRECTIONS.NORTH);
        room.hasEastDoor = room.isConnected(DIRECTIONS.EAST);
        room.hasSouthDoor = room.isConnected(DIRECTIONS.SOUTH);
        room.hasWestDoor = room.isConnected(DIRECTIONS.WEST);

        this.updateRoom(room);

        const events = [];
        const loot = [];

        let encounter = Encounter.fromRoom(this.biome, room);

        if(encounter !== null && !encounter.isFaulted)
        {
            const flavors = ["whooped", "walloped", "man-handled", "sucker-punched"];
            const message = `You have ${this.chance.pick(flavors)} the ${encounter.getChatName()}!`;

            events.push({type: "narrator-message", data: message});

            const encounterLoot = this.biome.determineLoot(encounter, this.chance);
            loot.push(...encounterLoot);
        }

        const feature = Feature.fromRoom(this.biome, room);

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
                case "UNCOMMON": flavor = "Meh."; break;
                case "RARE": flavor = "Nice! "; break;
                case "EPIC": flavor = "Oh Snap..."; break;
                case "LEGENDARY": flavor = "Holy Shit"; break;
                default: flavor = "Huh?"; break;
            }

            const message = `${flavor} You looted [${tag}][${item.name}][/${tag}]!`;

            events.push({type: "narrator-message", data: message});
        }

        if(feature !== null && feature.isExit)
        {
            events.push({type: "narrator-message", data: "[LEGENDARY]You reached the end! Go you![/LEGENDARY]"});
        }

        return events;
    }

    draw()
    {
        this.gfx.fillBackground(this.biome.theme.backgroundColor);

        for(let row = 0; row < this.gridRows; row++)
        {    
            for(let col = 0; col < this.gridCols; col++)
            {
                const room = this.getRoom(col, row);

                if(room === null || room.type == 0 || (!ENV.DEBUG && room.status == 0)) { continue; }

                this.drawRoom(room);
            }
        }

        this.drawHighlights();
        this.drawDebugHighlights();
    }

    drawRoom(room)
    {
        // get neighbors in connectable directions (N, E, S, W)
        const neighbors = room.getNeighborsByDirection(DIRECTIONS.getKeyDirections());

        for(const neighbor of neighbors)
        {
            this.drawRoomShadow(neighbor);
        }

        this.gfx.drawRectangle(room.drawX, room.drawY, 38, 38, this.biome.theme.backgroundColor);

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

        this.gfx.drawSprite(this.texture, roomData.spriteX, roomData.spriteY, room.drawX + 1, room.drawY + 1, 36, 36);

        this.drawEncounter(room, room.drawX, room.drawY);
        this.drawFeature(room, room.drawX, room.drawY);
    }

    drawRoomShadow(room)
    {
        // yield if the room is empty or has already been explored
        if(room === null || room.type == Room.TYPES.EMPTY || room.status > 0) { return; }

        this.gfx.drawRectangle(room.drawX + 1, room.drawY + 1, 36, 36, this.biome.theme.roomShadowColor);
    }

    drawEncounter(room)
    {
        const encounter = this.getEncounter(room);

        // yield if the encounter is not found
        if(encounter === null) { return; }

        const spriteX = encounter.spriteX;
        const spriteY = encounter.spriteY;
        const spriteOffsetX = (typeof encounter.spriteOffsetX !== "undefined" && encounter.spriteOffsetX != null)? encounter.spriteOffsetX: 0;
        const spriteOffsetY = (typeof encounter.spriteOffsetY !== "undefined" && encounter.spriteOffsetY != null)? encounter.spriteOffsetY: 0;

        this.gfx.drawSprite(this.texture, spriteX, spriteY, room.drawX + 3 + spriteOffsetX, room.drawY - 8 + spriteOffsetY);
    }

    drawFeature(room)
    {
        const feature = this.getFeature(room);

        // yeild if the feature could not be found
        if(feature == null) { return; }

        const spriteX = feature.spriteX;
        const spriteY = feature.spriteY;

        this.gfx.drawSprite(this.texture, spriteX, spriteY, room.drawX + 1, room.drawY + 1, 36, 36);
    }

    drawHighlights()
    {
        const w = 38;
        const h = 38;

        const currentRoom = this.getCurrentRoom();

        this.gfx.drawRectangleOutline((currentRoom.drawX), (currentRoom.drawY), 38, 38, "#fab40b", 2);
    }

    drawDebugHighlights()
    {
        if(!ENV.DEBUG) { return; }

        for(let row = 0; row < this.gridRows; row++)
        {    
            for(let col = 0; col < this.gridCols; col++)
            {
                const room = this.getRoom(col, row);

                if(ENV.DEBUG_FLAGS.indexOf("highlightEncounters") >= 0 && Encounter.containsEncounter(room))
                {
                    this.gfx.drawRectangleOutline(room.drawX, room.drawY, 38, 38, "red", 2);
                }

                if(ENV.DEBUG_FLAGS.indexOf("highlightFeatures") >= 0 && Feature.containsFeature(room))
                {
                    this.gfx.drawRectangleOutline(room.drawX, room.drawY, 38, 38, "blue", 2);
                }
            }
        }
    }
}