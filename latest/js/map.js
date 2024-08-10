class Map
{
    static STATES = {
        UNKNOWN: 0,
        LOADING_DATA: 1,
        LOADING_TEXTURES: 2,
        GENERATING_MAP: 3,
        MAP_READY: 4
    }

    constructor(gfx)
    {
        // key dependencies
        this.gfx = gfx;
        this.biome = new Biome("elven-ruins-standard");
        this.generator = new MapGenerator(this, SharedChance);
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

        // encounter and discoverable properties
        this.undefeatedRareEnemies = 0;
        this.maxRareEnemies = SharedChance.range(6, 8);

        this.undefeatedEpicEnemies = 0;
        this.maxEpicEnemies = SharedChance.range(2, 3);

        this.undefeatedLegendaryEnemies = 0;
        this.maxLegendaryEnemies = 1;

        this.undiscoveredRareTreasures = 0;
        this.maxRareTreasures = SharedChance.range(4, 6);

        this.undiscoveredEpicTreasures = 0;
        this.maxEpicTreasures = SharedChance.range(1, 2);

        this.undiscoveredLegendaryTreasures = 0;
        this.maxLegendaryTreasures = 1;
    }

    update()
    {
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
                const welcomeMessage = new ChatMessage(ChatMessage.TYPES.SPECIAL, GameEntity.SPECIAL_ENTITIES.NARRATOR, `Welcome to the ${this.biome.name}.`);
                GEQ.enqueue(new GameEvent(GameEvent.TYPES.MESSAGE, welcomeMessage.source, welcomeMessage));

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
        
        if(SharedChance.range(0, 10) < 8)
        {
            variant = (roomTypes.length > 0)? SharedChance.range(0, roomTypes.length - 1): 0;
        }
        else
        {
            variant = (roomTypes.length > 1)? SharedChance.range(0, 1): 0;
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

        const encounterKey = (encounterKeys.length > 0)? SharedChance.pick(encounterKeys): 0;
       
        room.status = 1; // 1 = explored
        room.variant = variant;
        room.encounterKey = encounterKey;
        room.hasNorthDoor = room.isConnected(DIRECTIONS.NORTH);
        room.hasEastDoor = room.isConnected(DIRECTIONS.EAST);
        room.hasSouthDoor = room.isConnected(DIRECTIONS.SOUTH);
        room.hasWestDoor = room.isConnected(DIRECTIONS.WEST);

        this.updateRoom(room);

        let encounter = Encounter.fromRoom(this.biome, room);

        if(encounter !== null && !encounter.isFaulted)
        {
            // create an event to let the game engine know an encounter has been triggered
            const event = new GameEvent(GameEvent.TYPES.ENCOUNTER, room, encounter);

            // add event to the global event queue
            GEQ.enqueue(event);
        }

        const discoverable = Discoverable.fromRoom(this.biome, room);

        if(discoverable !== null)
        {
            // create an event to let the game engine know a discoverable has been discovered
            const event = new GameEvent(GameEvent.TYPES.DISCOVERY, room, discoverable);

            // add event to the global event queue
            GEQ.enqueue(event);
        }
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
        this.drawDiscoverable(room, room.drawX, room.drawY);
    }

    drawRoomShadow(room)
    {
        // yield if the room is empty or has already been explored
        if(room === null || room.type == Room.TYPES.EMPTY || room.status > 0) { return; }

        this.gfx.drawRectangle(room.drawX + 1, room.drawY + 1, 36, 36, this.biome.theme.roomShadowColor);
    }

    drawEncounter(room)
    {
        const encounter = Encounter.fromRoom(this.biome, room);

        // yield if the encounter is not found
        if(encounter === null) { return; }

        const spriteX = encounter.spriteX;
        const spriteY = encounter.spriteY;
        const spriteOffsetX = (typeof encounter.spriteOffsetX !== "undefined" && encounter.spriteOffsetX != null)? encounter.spriteOffsetX: 0;
        const spriteOffsetY = (typeof encounter.spriteOffsetY !== "undefined" && encounter.spriteOffsetY != null)? encounter.spriteOffsetY: 0;

        this.gfx.drawSprite(this.texture, spriteX, spriteY, room.drawX + 3 + spriteOffsetX, room.drawY - 8 + spriteOffsetY);
    }

    drawDiscoverable(room)
    {
        const discoverable = Discoverable.fromRoom(this.biome, room);

        // yeild if the discoverable could not be found
        if(discoverable == null) { return; }

        const spriteX = discoverable.spriteX;
        const spriteY = discoverable.spriteY;

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

                if(ENV.DEBUG_FLAGS.indexOf("highlightDiscoverables") >= 0 && Discoverable.containsDiscoverable(room))
                {
                    this.gfx.drawRectangleOutline(room.drawX, room.drawY, 38, 38, "blue", 2);
                }
            }
        }
    }
}