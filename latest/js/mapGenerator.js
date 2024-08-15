class MapGenerator
{
    static STATES = {
        UNKNOWN: 0,
        LOADING: 1,
        GENERATING: 2,
        FINALIZING: 3
    }

    constructor(map)
    {
        this.map = map;
        this.state = MapGenerator.STATES.UNKNOWN;
    }

    update()
    {
        if(this.state == MapGenerator.STATES.COMPLETE)
        {
            return;
        }
        else if(this.state == MapGenerator.STATES.UNKNOWN)
        {
            this.state = MapGenerator.STATES.LOADING;

            this.initializeGrid();
            this.loadSectors();
        }
        else if(this.state == MapGenerator.STATES.LOADING)
        {
            let isDataReady = true;

            for(const sector of this.map.sectors.flat())
            {
                if(!sector.isReady) { isDataReady = false; break; }
            }

            // yield if data is not ready
            if(!isDataReady) { return; }
            
            this.state = MapGenerator.STATES.GENERATING;
        }
        else if(this.state == MapGenerator.STATES.GENERATING)
        {
            this.generateSectors();
            this.connectRooms();
            this.expandPathways();
            this.expandWalls();
            this.convertPlaceholders();
            this.generateSpawn();

            this.state = MapGenerator.STATES.FINALIZING;
        }
        else if(this.state == MapGenerator.STATES.FINALIZING)
        {
            // handle any debug requirements
            //this.handleDebug();

            // set the map state to ready
            this.map.state = Map.STATES.MAP_READY;

            // let the rest of the game know the map is ready
            GEQ.enqueue(new GameEvent(GameEvent.TYPES.MAP, GameEntity.SPECIAL_ENTITIES.MAP, Map.STATES.MAP_READY));

            this.map.renderer.calcDrawOffsetX(this.map.spawnMapTile.col, this.map.spawnMapTile.row, true);

            this.state = MapGenerator.STATES.COMPLETE;
        }
    }

    initializeGrid()
    {
        const sectorCount = 4;
        const sectorSize = 16;

        this.map.gridRows = (sectorCount * sectorSize) + (2 * (sectorCount - 1));
        this.map.gridCols = (sectorCount * sectorSize) + (2 * (sectorCount - 1));

        this.map.grid = this.map.grid || [];

        for (let rows = 0; rows < this.map.gridRows; rows++)
        {
            this.map.grid[rows] = this.map.grid[rows] || [];

            for (let col = 0; col < this.map.gridCols; col++)
            {
                this.map.grid[rows][col] = MapTile.generateEmptyMapTile(this.map, col, rows, 0).compress();
            }
        }
    }

    loadSectors()
    {
        const sectorKeys = [
            "generic-alter-room-001",
            "generic-room-cluster-001"
        ];

        // initialise the sectors that will control the layout of the level
		// sectors are 16x16 groups of tiles with a pretedermined set of encounters
		// encounters will be randomly placed throughout each sector
		this.map.sectors = [];
		this.sectorSize = 16;

		for(let row = 0; row < 4; row++)
		{
            this.map.sectors[row] = this.map.sectors[row] || [];

			for(let col = 0; col < 4; col++)
			{
                const key = SharedChance.pick(sectorKeys);

				const startX = (col * this.sectorSize) + (col * 2);
				const startY = (row * this.sectorSize) + (row * 2);
				const finishX = startX + (this.sectorSize - 1);
				const finishY = startY + (this.sectorSize - 1);

				this.map.sectors[row][col] = new DungeonSector(this.map, key, startX, startY, finishX, finishY);
			}
		}
    }

    generateSectors()
    {
        for(const row of this.map.sectors)
        {
            for(const sector of row)
            {
                sector.constructRoom();
            }
        }
    }

    generateSpawn()
    {
        const sectors = this.map.sectors.flat();

        // establish spawn tile
        const spawnSector = SharedChance.pick(sectors);
        const possibleSpawnTiles = spawnSector.getTilePositions(MapTile.TYPES.FLOOR).map(pos => this.map.getTile(pos.col, pos.row));

        const spawnTile = SharedChance.pick(possibleSpawnTiles);

        spawnTile.type = MapTile.TYPES.SPAWN;
        this.map.updateMapTile(spawnTile);

        this.map.exploreMapTile(spawnTile.col, spawnTile.row);

        this.map.spawnMapTile = spawnTile;
    }

    connectRooms()
    {
        // connect the rooms together by grouping sectors in to groups of four
		// each group is comprised of two northern sectors and two southern sectors
		// each group will have one external connection to the next group to the east (if it exists)
		// each group will have one external connection to the next group to the south (if it exists)
		// various internal connections within the group will ensure all rooms are accessible
		const columns = 4;
		const rows = 4;
        const junctionBuffer = 1;

		// groups are formed by iterating over the grid in steps of 2
		for(let row = 0; row < rows; row += 2)
		{
			for(let col = 0; col < columns; col += 2)
			{
				// establish external connections (beyond local group of 4 sectors)
				const needsEasternConnection = (col + 2 < columns);
				const needsSouthernConnection = (row + 2 < rows);

				if(needsEasternConnection)
				{
					const rowOffsetA = SharedChance.range(0, 1);
					const rowOffsetB = SharedChance.range(0, 1);

					const sectorA = this.map.sectors[row + rowOffsetA][col + 1];
					const sectorB = this.map.sectors[row + rowOffsetB][col + 2];

                    const doorA = this.createDoor(sectorA.doorPositions[DIRECTIONS.EAST]);
                    const doorB = this.createDoor(sectorB.doorPositions[DIRECTIONS.WEST]);

                    this.connectTiles(doorA, doorB);
				}

				if(needsSouthernConnection)
				{
					const colOffsetA = SharedChance.range(0, 1);
					const colOffsetB = SharedChance.range(0, 1);

					const sectorA = this.map.sectors[row + 1][col + colOffsetA];
					const sectorB = this.map.sectors[row + 2][col + colOffsetB];

                    const doorA = this.createDoor(sectorA.doorPositions[DIRECTIONS.SOUTH]);
                    const doorB = this.createDoor(sectorB.doorPositions[DIRECTIONS.NORTH]);

                    this.connectTiles(doorA, doorB);
				}

				// establish internal connections (within local group of 4 sectors)
				const sectorA = this.map.sectors[row][col];
				const sectorB = this.map.sectors[row][col + 1];
				const sectorC = this.map.sectors[row + 1][col];
				const sectorD = this.map.sectors[row + 1][col + 1];

				const useDoubleInnerSouthernConnection = (SharedChance.range(0, 1) == 0);

				if(useDoubleInnerSouthernConnection)
				{
					// make two inner southern connections
                    const southDoorA = this.createDoor(sectorA.doorPositions[DIRECTIONS.SOUTH]);
                    const southDoorB = this.createDoor(sectorB.doorPositions[DIRECTIONS.SOUTH]);
                    const northDoorC = this.createDoor(sectorC.doorPositions[DIRECTIONS.NORTH]);
                    const northDoorD = this.createDoor(sectorD.doorPositions[DIRECTIONS.NORTH]);

                    this.connectTiles(southDoorA, northDoorC);
                    this.connectTiles(southDoorB, northDoorD);

					// make one inner eastern connection
					const doorA = (SharedChance.range(0, 1) == 0)? this.createDoor(sectorA.doorPositions[DIRECTIONS.EAST]) : this.createDoor(sectorC.doorPositions[DIRECTIONS.EAST]);
					const doorB = (SharedChance.range(0, 1) == 0)? this.createDoor(sectorB.doorPositions[DIRECTIONS.WEST]) : this.createDoor(sectorD.doorPositions[DIRECTIONS.WEST]);

					this.connectTiles(doorA, doorB);
				}
				else
				{
					// make two inner easter connections
                    const eastDoorA = this.createDoor(sectorA.doorPositions[DIRECTIONS.EAST]);
                    const eastDoorC = this.createDoor(sectorC.doorPositions[DIRECTIONS.EAST]);
                    const westDoorB = this.createDoor(sectorB.doorPositions[DIRECTIONS.WEST]);
                    const westDoorD = this.createDoor(sectorD.doorPositions[DIRECTIONS.WEST]);

                    this.connectTiles(eastDoorA, westDoorB);
                    this.connectTiles(eastDoorC, westDoorD);

					// make one inner eastern connection
					const doorA = (SharedChance.range(0, 1) == 0)? this.createDoor(sectorA.doorPositions[DIRECTIONS.SOUTH]) : this.createDoor(sectorB.doorPositions[DIRECTIONS.SOUTH]);
					const doorB = (SharedChance.range(0, 1) == 0)? this.createDoor(sectorC.doorPositions[DIRECTIONS.NORTH]) : this.createDoor(sectorD.doorPositions[DIRECTIONS.NORTH]);

					this.connectTiles(doorA, doorB);
				}
			}
		}

        // clean up unused temporary doors
        this.getTilesByType(MapTile.TYPES.GEN_DOOR).forEach(tile => { tile.type = MapTile.TYPES.WALL; this.map.updateMapTile(tile); });
    }

    createDoor(pos)
    {
        const tile = this.map.getTile(pos.col, pos.row);

        tile.type = MapTile.TYPES.DOOR;
        this.map.updateMapTile(tile);

        return tile;
    }

    createJunction(pos, direction, buffer)
    {
        const delta = DIRECTIONS.getDirectionDeltas(direction);

        const junctionCol = pos.col + (delta.col * buffer);
        const junctionRow = pos.row + (delta.row * buffer);

        const junctionTile = this.map.getTile(junctionCol, junctionRow);

        junctionTile.type = MapTile.TYPES.GEN_JUNCTION;
        this.map.updateMapTile(junctionTile);

        return junctionTile;
    }

    connectTiles(tileA, tileB)
	{
		const path = this.map.pathFinder.calculatePath(tileA, tileB, [MapTile.TYPES.DOOR, MapTile.TYPES.GEN_DOOR, MapTile.TYPES.EMPTY, MapTile.TYPES.GEN_JUNCTION]);

        for(const node of path)
        {
            const tile = node.tile;

            if(tile.type == MapTile.TYPES.EMPTY)
            {
                tile.type = MapTile.TYPES.GEN_PATHWAY;
                this.map.updateMapTile(tile);
            }
        }
	}

    getTilesByType(type)
    {
        const tiles = [];

        for(const row of this.map.grid)
        {
            for(const col of row)
            {
                const tile = new MapTile(this.map, col);

                if(tile.type === type)
                {
                    tiles.push(tile);
                }
            }
        }

        return tiles;
    }

    expandPathways()
    {
		// expand the pathways between rooms by converting adjacent unknown (empty) tiles to GEN_EXPANSION tiles
		// the pathway tiles were set to GEN_PATHWAY in the previous step for easy identification during this step
		for(const row of this.map.grid)
        {
            for(const col of row)
            {
                const tile = new MapTile(this.map, col);

                if(tile.type !== MapTile.TYPES.GEN_PATHWAY) { continue; }

                const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getAllDirections());

                for(const neighbour of neighbors.filter(candidate => candidate.type == MapTile.TYPES.EMPTY))
                {
                    if(neighbour.col == 0 || neighbour.col == this.map.gridCols - 1 || neighbour.row == 0 || neighbour.row == this.map.gridRows - 1) { continue; }

                    neighbour.type = MapTile.TYPES.GEN_EXPANSION;
                    this.map.updateMapTile(neighbour);
                }
            }
        }
    }

    expandWalls()
    {
		this.generateExpansionWalls();

        this.closeVoids([MapTile.TYPES.GEN_WALL, MapTile.TYPES.WALL]);
        this.closeVoids([MapTile.TYPES.GEN_EXPANSION]);
        this.sealExpansion();
        this.closeVoids([MapTile.TYPES.GEN_WALL, MapTile.TYPES.WALL]);
        this.sealExpansion();

        // convert GEN_WALL tiles in to walls tiles if they have any unknown (empty) neighbors
        for(const row of this.map.grid)
        {
            for(const col of row)
            {
                const tile = new MapTile(this.map, col);

                if(tile.type !== MapTile.TYPES.GEN_WALL) { continue; }

                // determine how many neighbors are voids/unknown
                const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getAllDirections());
                const voids = neighbors.reduce((acc, neighbour) => acc + ((neighbour.type === MapTile.TYPES.EMPTY) ? 1 : 0), 0);
                
                if(voids > 0 || tile.col == 0 || tile.col == this.map.gridCols - 1 || tile.row == 0 || tile.row == this.map.gridRows - 1)
                {
                    tile.type = MapTile.TYPES.GEN_WALL;
                    this.map.updateMapTile(tile);
                }
                else
                {
                    tile.type = MapTile.TYPES.GEN_EXPANSION;
                    this.map.updateMapTile(tile);
                }
            }
        }
    }

    generateExpansionWalls()
    {
        // convert any unknown (empty) tiles that are adjacent to GEN_PATHWAY and GEN_EXPANSION tiles in to GEN_WALL tiles
        // these will be candidates for becoming walls in the next step
		for(const row of this.map.grid)
        {
            for(const col of row)
            {
                const tile = new MapTile(this.map, col);

                if(tile.type !== MapTile.TYPES.GEN_PATHWAY && tile.type !== MapTile.TYPES.GEN_EXPANSION) { continue; }

                const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getAllDirections());

                for(const neighbour of neighbors.filter(candidate => candidate.type == MapTile.TYPES.EMPTY))
                {
                    neighbour.type = MapTile.TYPES.GEN_WALL;
                    this.map.updateMapTile(neighbour);
                }
            }
        }
    }

    closeVoids(adjacentTypes)
    {
        // convert any empty tiles that are adjacent to two GEN_WALL tiles in to GEN_EXPANSION tiles
        for(const row of this.map.grid)
        {
            for(const col of row)
            {
                const tile = new MapTile(this.map, col);

                if(tile.type !== MapTile.TYPES.EMPTY) { continue; }

                // determine how many neighbors are voids/unknown

                const horizontalNeighbors = tile.getNeighborsByDirection([DIRECTIONS.EAST, DIRECTIONS.WEST]);
                const horizontalMatches = horizontalNeighbors.reduce((acc, neighbour) => acc + ((adjacentTypes.includes(neighbour.type)) ? 1 : 0), 0);

                const verticalNeighbors = tile.getNeighborsByDirection([DIRECTIONS.NORTH, DIRECTIONS.SOUTH]);
                const verticalMatches = verticalNeighbors.reduce((acc, neighbour) => acc + ((adjacentTypes.includes(neighbour.type)) ? 1 : 0), 0);
                
                if(horizontalMatches == 2 || verticalMatches == 2)
                {
                    tile.type = MapTile.TYPES.GEN_EXPANSION;
                    this.map.updateMapTile(tile);
                }
            }
        }
    }

    sealExpansion()
    {
        // convert any GEN_EXPANSION that are adjacent to void tiles in to GEN_WALL tiles
        for(const row of this.map.grid)
        {
            for(const col of row)
            {
                const tile = new MapTile(this.map, col);

                if(tile.type !== MapTile.TYPES.GEN_EXPANSION) { continue; }

                // determine how many neighbors are voids/unknown
                const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getAllDirections());
                const voids = neighbors.reduce((acc, neighbour) => acc + ((neighbour.type === MapTile.TYPES.EMPTY) ? 1 : 0), 0);
                
                if(voids > 0 || tile.col == 0 || tile.col == this.map.gridCols - 1 || tile.row == 0 || tile.row == this.map.gridRows - 1)
                {
                    tile.type = MapTile.TYPES.GEN_WALL;
                    this.map.updateMapTile(tile);
                }
            }
        }
    }

    convertPlaceholders()
    {
		for(const row of this.map.grid)
		{
            for(const col of row)
            {
                const tile = new MapTile(this.map, col);

                if(tile.type === MapTile.TYPES.GEN_PATHWAY || tile.type === MapTile.TYPES.GEN_EXPANSION)
                {
                    tile.type = MapTile.TYPES.FLOOR;
                    this.map.updateMapTile(tile);
                }
                else if(tile.type === MapTile.TYPES.GEN_WALL)
                {
                    tile.type = MapTile.TYPES.WALL;
                    this.map.updateMapTile(tile);
                }
            }
		}
    }

    generateEncounter(tile, rarity)
    {
        tile.type = MapTile.TYPES.ENCOUNTER;
        tile.rarity = rarity;

        this.map.updateMapTile(tile);
    }

    handleDebug()
    {
        if(!ENV.DEBUG) { return; }

        console.log(`Legendary Encounters: ${this.map.undefeatedLegendaryEnemies}/${this.map.maxLegendaryEnemies}`);
        console.log(`Epic Encounters: ${this.map.undefeatedEpicEnemies}/${this.map.maxEpicEnemies}`);
        console.log(`Rare Encounters: ${this.map.undefeatedRareEnemies}/${this.map.maxRareEnemies}`);

        console.log(`Legendary Treasures: ${this.map.undiscoveredLegendaryTreasures}/${this.map.maxLegendaryTreasures}`);
        console.log(`Epic Treasures: ${this.map.undiscoveredEpicTreasures}/${this.map.maxEpicTreasures}`);
        console.log(`Rare Treasures: ${this.map.undiscoveredRareTreasures}/${this.map.maxRareTreasures}`);

        // explore all the tiles
        for(let row = 0; row < this.map.gridRows; row++)
        {
            for(let col = 0; col < this.map.gridCols; col++)
            {
                this.map.exploreMapTile(col, row);
            }
        }
    }

}