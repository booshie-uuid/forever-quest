class MapGenerator
{
    static STATES = {
        UNKNOWN: 0,
        LOADING: 1,
        GENERATING: 2,
        FINALIZING: 3
    }

    constructor(parentMap)
    {
        this.parent = parentMap;
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

            this.parent.initializeGrid();
            this.loadSectors();
        }
        else if(this.state == MapGenerator.STATES.LOADING)
        {
            let isDataReady = true;

            for(const sector of this.parent.sectors.flat())
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
            this.parent.state = Map.STATES.MAP_READY;

            // let the rest of the game know the map is ready
            GEQ.enqueue(new GameEvent(GameEvent.TYPES.MAP, GameEntity.SPECIAL_ENTITIES.MAP, Map.STATES.MAP_READY));

            this.parent.renderer.calcDrawOffsetX(this.parent.spawnMapTile.col, this.parent.spawnMapTile.row, true);

            this.state = MapGenerator.STATES.COMPLETE;
        }
    }

    loadSectors()
    {
        const sectorConfigs = [];

        sectorConfigs.push(...this.parent.biome.specialSectors);

        while(sectorConfigs.length < (this.parent.sectorCount * this.parent.sectorCount))
        {
            sectorConfigs.push(GAME.chance.pick(this.parent.biome.generalSectors));
        }

        sectorConfigs.sort(() => GAME.chance.random() - 0.5);

        // initialise the sectors that will control the layout of the level
		// sectors are 15x15 groups of tiles with a pretedermined set of encounters
		// encounters will be randomly placed throughout each sector
		this.parent.sectors = [];

		for(let row = 0; row < this.parent.sectorCount; row++)
		{
            this.parent.sectors[row] = this.parent.sectors[row] || [];

			for(let col = 0; col < this.parent.sectorCount; col++)
			{
                const config = sectorConfigs.shift();

				const startX = (col * MapSector.SECTOR_SIZE) + (col * 2);
				const startY = (row * MapSector.SECTOR_SIZE) + (row * 2);
				const finishX = startX + (MapSector.SECTOR_SIZE - 1);
				const finishY = startY + (MapSector.SECTOR_SIZE - 1);

                const sector = new MapSector(this.parent, config, startX, startY, finishX, finishY);

				this.parent.sectors[row][col] = sector;
			}
		}
    }

    generateSectors()
    {
        for(const row of this.parent.sectors)
        {
            for(const sector of row)
            {
                sector.constructRoom();
            }
        }
    }

    generateSpawn()
    {
        const sectors = this.parent.sectors.flat();

        // establish spawn tile
        const spawnSector = GAME.chance.pick(sectors);
        const possibleSpawnTiles = spawnSector.getTilePositions(MapTile.TYPES.FLOOR).map(pos => this.parent.getTile(pos.col, pos.row));

        const spawnTile = GAME.chance.pick(possibleSpawnTiles);

        spawnTile.setTypeWithDefaults(MapTile.TYPES.FLOOR);

        this.parent.exploreMapTile(spawnTile.col, spawnTile.row);

        this.parent.spawnMapTile = spawnTile;
    }

    connectRooms()
    {
        // connect the rooms together by grouping sectors in to groups of four
		// each group is comprised of two northern sectors and two southern sectors
		// each group will have one external connection to the next group to the east (if it exists)
		// each group will have one external connection to the next group to the south (if it exists)
		// various internal connections within the group will ensure all rooms are accessible
		const columns = this.parent.sectorCount;
		const rows = this.parent.sectorCount;

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
					const rowOffsetA = GAME.chance.range(0, 1);
					const rowOffsetB = GAME.chance.range(0, 1);

					const sectorA = this.parent.sectors[row + rowOffsetA][col + 1];
					const sectorB = this.parent.sectors[row + rowOffsetB][col + 2];

                    const doorA = this.createDoor(sectorA.doorPositions[DIRECTIONS.EAST]);
                    const doorB = this.createDoor(sectorB.doorPositions[DIRECTIONS.WEST]);

                    this.connectTiles(doorA, doorB);
				}

				if(needsSouthernConnection)
				{
					const colOffsetA = GAME.chance.range(0, 1);
					const colOffsetB = GAME.chance.range(0, 1);

					const sectorA = this.parent.sectors[row + 1][col + colOffsetA];
					const sectorB = this.parent.sectors[row + 2][col + colOffsetB];

                    const doorA = this.createDoor(sectorA.doorPositions[DIRECTIONS.SOUTH]);
                    const doorB = this.createDoor(sectorB.doorPositions[DIRECTIONS.NORTH]);

                    this.connectTiles(doorA, doorB);
				}

				// establish internal connections (within local group of 4 sectors)
				const sectorA = this.parent.sectors[row][col];
				const sectorB = this.parent.sectors[row][col + 1];
				const sectorC = this.parent.sectors[row + 1][col];
				const sectorD = this.parent.sectors[row + 1][col + 1];

				const useDoubleInnerSouthernConnection = (GAME.chance.range(0, 1) == 0);

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
					const doorA = (GAME.chance.range(0, 1) == 0)? this.createDoor(sectorA.doorPositions[DIRECTIONS.EAST]) : this.createDoor(sectorC.doorPositions[DIRECTIONS.EAST]);
					const doorB = (GAME.chance.range(0, 1) == 0)? this.createDoor(sectorB.doorPositions[DIRECTIONS.WEST]) : this.createDoor(sectorD.doorPositions[DIRECTIONS.WEST]);

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
					const doorA = (GAME.chance.range(0, 1) == 0)? this.createDoor(sectorA.doorPositions[DIRECTIONS.SOUTH]) : this.createDoor(sectorB.doorPositions[DIRECTIONS.SOUTH]);
					const doorB = (GAME.chance.range(0, 1) == 0)? this.createDoor(sectorC.doorPositions[DIRECTIONS.NORTH]) : this.createDoor(sectorD.doorPositions[DIRECTIONS.NORTH]);

					this.connectTiles(doorA, doorB);
				}
			}
		}
    }

    createDoor(pos)
    {
        const tile = this.parent.getTile(pos.col, pos.row);

        tile.setTypeWithDefaults(MapTile.TYPES.DOOR);

        return tile;
    }

    connectTiles(tileA, tileB)
	{
		const path = this.parent.pathFinder.calculatePath(tileA, tileB, [MapTile.TYPES.DOOR, MapTile.TYPES.GEN_DOOR, MapTile.TYPES.EMPTY, MapTile.TYPES.GEN_JUNCTION], true);

        for(const node of path)
        {
            const tile = node.tile;

            if(tile.type == MapTile.TYPES.EMPTY)
            {
                tile.setTypeWithDefaults(MapTile.TYPES.GEN_PATHWAY);
            }
        }
	}

    expandPathways()
    {
		// expand the pathways between rooms by converting adjacent unknown (empty) tiles to GEN_EXPANSION tiles
		// the pathway tiles were set to GEN_PATHWAY in the previous step for easy identification during this step
		for(const row of this.parent.grid)
        {
            for(const tile of row)
            {
                if(tile.type !== MapTile.TYPES.GEN_PATHWAY) { continue; }

                const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getAllDirections());

                for(const neighbour of neighbors.filter(candidate => candidate.type == MapTile.TYPES.EMPTY))
                {
                    if(neighbour.col == 0 || neighbour.col == this.parent.gridCols - 1 || neighbour.row == 0 || neighbour.row == this.parent.gridRows - 1) { continue; }

                    neighbour.setTypeWithDefaults(MapTile.TYPES.GEN_EXPANSION);
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
        for(const row of this.parent.grid)
        {
            for(const tile of row)
            {
                if(tile.type !== MapTile.TYPES.GEN_WALL) { continue; }

                // determine how many neighbors are voids/unknown
                const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getAllDirections());
                const voids = neighbors.reduce((acc, neighbour) => acc + ((neighbour.type === MapTile.TYPES.EMPTY) ? 1 : 0), 0);
                
                if(voids > 0 || tile.col == 0 || tile.col == this.parent.gridCols - 1 || tile.row == 0 || tile.row == this.parent.gridRows - 1)
                {
                    tile.setTypeWithDefaults(MapTile.TYPES.GEN_WALL);
                }
                else
                {
                    tile.setTypeWithDefaults(MapTile.TYPES.GEN_EXPANSION);
                }
            }
        }
    }

    generateExpansionWalls()
    {
        // convert any unknown (empty) tiles that are adjacent to GEN_PATHWAY and GEN_EXPANSION tiles in to GEN_WALL tiles
        // these will be candidates for becoming walls in the next step
		for(const row of this.parent.grid)
        {
            for(const tile of row)
            {
                if(tile.type !== MapTile.TYPES.GEN_PATHWAY && tile.type !== MapTile.TYPES.GEN_EXPANSION) { continue; }

                const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getAllDirections());

                for(const neighbour of neighbors.filter(candidate => candidate.type == MapTile.TYPES.EMPTY))
                {
                    neighbour.setTypeWithDefaults(MapTile.TYPES.GEN_WALL);
                }
            }
        }
    }

    closeVoids(adjacentTypes)
    {
        // convert any empty tiles that are adjacent to two GEN_WALL tiles in to GEN_EXPANSION tiles
        for(const row of this.parent.grid)
        {
            for(const tile of row)
            {
                if(tile.type !== MapTile.TYPES.EMPTY) { continue; }

                // determine how many neighbors are voids/unknown

                const horizontalNeighbors = tile.getNeighborsByDirection([DIRECTIONS.EAST, DIRECTIONS.WEST]);
                const horizontalMatches = horizontalNeighbors.reduce((acc, neighbour) => acc + ((adjacentTypes.includes(neighbour.type)) ? 1 : 0), 0);

                const verticalNeighbors = tile.getNeighborsByDirection([DIRECTIONS.NORTH, DIRECTIONS.SOUTH]);
                const verticalMatches = verticalNeighbors.reduce((acc, neighbour) => acc + ((adjacentTypes.includes(neighbour.type)) ? 1 : 0), 0);
                
                if(horizontalMatches == 2 || verticalMatches == 2)
                {
                    tile.setTypeWithDefaults(MapTile.TYPES.GEN_EXPANSION);
                }
            }
        }
    }

    sealExpansion()
    {
        // convert any GEN_EXPANSION that are adjacent to void tiles in to GEN_WALL tiles
        for(const row of this.parent.grid)
        {
            for(const tile of row)
            {
                if(tile.type !== MapTile.TYPES.GEN_EXPANSION) { continue; }

                // determine how many neighbors are voids/unknown
                const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getAllDirections());
                const voids = neighbors.reduce((acc, neighbour) => acc + ((neighbour.type === MapTile.TYPES.EMPTY) ? 1 : 0), 0);
                
                if(voids > 0 || tile.col == 0 || tile.col == this.parent.gridCols - 1 || tile.row == 0 || tile.row == this.parent.gridRows - 1)
                {
                    tile.setTypeWithDefaults(MapTile.TYPES.GEN_WALL);
                }
            }
        }
    }

    convertPlaceholders()
    {
		for(const row of this.parent.grid)
		{
            for(const tile of row)
            {
                if(tile.type === MapTile.TYPES.GEN_PATHWAY || tile.type === MapTile.TYPES.GEN_EXPANSION)
                {
                    tile.setTypeWithDefaults(MapTile.TYPES.FLOOR);
                }
                else if(tile.type === MapTile.TYPES.GEN_WALL || tile.type === MapTile.TYPES.GEN_DOOR)
                {
                    tile.setTypeWithDefaults(MapTile.TYPES.WALL);
                }
            }
		}
    }

    handleDebug()
    {
        if(!ENV.DEBUG) { return; }

        console.log(`Legendary Encounters: ${this.parent.undefeatedLegendaryEnemies}/${this.parent.maxLegendaryEnemies}`);
        console.log(`Epic Encounters: ${this.parent.undefeatedEpicEnemies}/${this.parent.maxEpicEnemies}`);
        console.log(`Rare Encounters: ${this.parent.undefeatedRareEnemies}/${this.parent.maxRareEnemies}`);

        console.log(`Legendary Treasures: ${this.parent.undiscoveredLegendaryTreasures}/${this.parent.maxLegendaryTreasures}`);
        console.log(`Epic Treasures: ${this.parent.undiscoveredEpicTreasures}/${this.parent.maxEpicTreasures}`);
        console.log(`Rare Treasures: ${this.parent.undiscoveredRareTreasures}/${this.parent.maxRareTreasures}`);

        // explore all the tiles
        for(let row = 0; row < this.parent.gridRows; row++)
        {
            for(let col = 0; col < this.parent.gridCols; col++)
            {
                this.parent.exploreMapTile(col, row);
            }
        }
    }

}