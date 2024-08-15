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

        this.gridCols = 64;
        this.gridRows = 64;

        this.sectors = [];
        
        this.currentCol = -1;
        this.currentRow = -1;

        this.spawnMapTile = null;

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
            this.generator.update();
        }
    }

    getCurrentMapTile()
    {
        return this.getTile(this.currentCol, this.currentRow);
    }

    getTileFromPos(pos)
    {
        if(pos === null) { return null; }

        if(pos.col < 0 || pos.col >= this.gridCols || pos.row < 0 || pos.row >= this.gridRows) { return null; }

        return this.getTile(pos.col, pos.row);
    }

    getTile(col, row)
    {
        if(col < 0 || col >= this.gridCols || row < 0 || row >= this.gridRows) { return null; }

        return new MapTile(this, this.grid[row][col]);
    }

    updateMapTile(tile)
    {
        this.grid[tile.row][tile.col] = tile.compress();
    }

    exploreMapTile(col, row)
    {
        const tile = this.getTile(col, row);

        // yield if empty or already explored
        if(tile.type == MapTile.TYPES.EMPTY || tile.status == 2) { return; }

        let childKey = tile.childKey;

        if(childKey === null)
        {
            switch(tile.type)
            {
                case MapTile.TYPES.ENCOUNTER: childKey = Encounter.getRandomKey(this.biome, tile); break;
                case MapTile.TYPES.DISCOVERABLE: childKey = Discoverable.getRandomKey(this.biome, tile); break;
                default: null; break;
            }
        }
       
        if(tile.type == MapTile.TYPES.DOOR)
        {
            tile.isOpen = true;
        }

        tile.status = 2; // 2 = explored
        //tile.variant = variant;
        tile.childKey = childKey;

        this.updateMapTile(tile);

        let neighbors = tile.getNeighborsByDirection(DIRECTIONS.getKeyDirections());

        for(const neighbor of neighbors)
        {
            neighbor.status = (neighbor.status === 0)? 1: neighbor.status; // 1 = revealed
            this.updateMapTile(neighbor);
        }

        let encounter = Encounter.fromMapTile(this.biome, tile);

        if(encounter !== null && !encounter.isFaulted)
        {
            // create an event to let the game engine know an encounter has been triggered
            const event = new GameEvent(GameEvent.TYPES.ENCOUNTER, tile, encounter);

            // add event to the global event queue
            GEQ.enqueue(event);
        }

        const discoverable = Discoverable.fromMapTile(this.biome, tile);

        if(discoverable !== null)
        {
            // create an event to let the game engine know a discoverable has been discovered
            const event = new GameEvent(GameEvent.TYPES.DISCOVERY, tile, discoverable);

            // add event to the global event queue
            GEQ.enqueue(event);
        }
    }
}