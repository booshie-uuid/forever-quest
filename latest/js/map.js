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
        this.generator = new MapGenerator(this);
        this.renderer =  null; // initialised after data and texture load
        this.texture = null;
        this.pathFinder = new PathFinder(this);

        // map state and other important flags
        this.state = Map.STATES.LOADING_DATA;

        // map grid and grid properties
        this.grid = null;

        this.gridCols = 25;
        this.gridRows = 15;
        
        this.currentCol = -1;
        this.currentRow = -1;

        this.spawnRoom = null;

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
            this.renderer.draw();
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

                // initialise map generator
                this.renderer = new MapRenderer(this);
            }
        }
        else if(this.state == Map.STATES.GENERATING_MAP)
        {
            // populate the grid if it has not already been done
            this.generator.generateRooms();

            // set the map state to ready
            this.state = Map.STATES.MAP_READY;

            // raise an event to let the game know the map is ready
            GEQ.enqueue(new GameEvent(GameEvent.TYPES.MAP, GameEntity.SPECIAL_ENTITIES.MAP, this.state));
        }
    }

    getCurrentRoom()
    {
        return this.getRoom(this.currentCol, this.currentRow);
    }

    getRoom(x, y)
    {
        if(x < 0 || x >= this.gridCols || y < 0 || y >= this.gridRows) { return null; }

        return new Room(this, this.grid[y][x]);
    }

    updateRoom(room)
    {
        this.grid[room.row][room.col] = room.compress();
    }

    exploreRoom(x, y)
    {
        const room = this.getRoom(x, y);

        // yield if empty or already explored
        if(room.type == Room.TYPES.EMPTY || room.status == 2) { return; }

        let types = [];

        if(room.type == Room.TYPES.REGULAR)
        {    
            types = this.biome.commonRooms;
        }
        else
        {
            types = this.biome.rareRooms;
        }

        let variant = 0; 
        
        if(SharedChance.range(0, 10) < 8)
        {
            variant = (types.length > 0)? SharedChance.range(0, types.length - 1): 0;
        }
        else
        {
            variant = (types.length > 1)? SharedChance.range(0, 1): 0;
        }

        let childKey = room.childKey;

        if(childKey === null)
        {
            switch(room.type)
            {
                case Room.TYPES.ENCOUNTER: childKey = Encounter.getRandomKey(this.biome, room); break;
                case Room.TYPES.DISCOVERABLE: childKey = Discoverable.getRandomKey(this.biome, room); break;
                default: null; break;
            }
        }
       
        room.status = 2; // 2 = explored
        room.variant = variant;
        room.childKey = childKey;

        this.updateRoom(room);

        let neighbors = room.getNeighborsByDirection(DIRECTIONS.getKeyDirections());

        for(const neighbor of neighbors)
        {
            neighbor.status = (neighbor.status === 0)? 1: neighbor.status; // 1 = revealed
            this.updateRoom(neighbor);
        }

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
}