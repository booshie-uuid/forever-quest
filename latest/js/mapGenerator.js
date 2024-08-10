class MapGenerator
{
    constructor(map)
    {
        this.map = map;
    }

    initializeGrid()
    {
        this.map.grid = this.map.grid || [];

        for (let rows = 0; rows < this.map.gridRows; rows++)
        {
            this.map.grid[rows] = this.map.grid[rows] || [];

            for (let col = 0; col < this.map.gridCols; col++)
            {
                this.map.grid[rows][col] = Room.generateEmptyRoom(this.map, col, rows, 0).compress();
            }
        }
    }

    generateRooms()
    {
        this.initializeGrid();
        
        // keep track of the rooms that have been populated
        const rooms = [];

        // generate a foundational path that crosses the entire grid       
        this.generateFoundation(rooms);

        // generate a series of corridors that branch off from the foundational path
        this.generateCorridors(rooms);

        // find all of the rooms that are deadends (flagged during corridor creation)
        // deadends are important because they are where most encounters will be placed
        let deadends = rooms.filter(room => room.type == Room.TYPES.DEADEND).sort(() => Math.random() - 0.5);      

        // close off a few loops to make the dungeon feel more interconnected
        this.generateLoops(Math.min(3, deadends.length), deadends);

        // update the list of deadends to remove any rooms that are no longer deadends
        // due to the closing off of loops
        deadends = deadends.filter(room => room.type === Room.TYPES.DEADEND);

        // choose a deadend at random to serve as the spawn room
        const spawnRoom = SharedChance.pick(deadends);

        spawnRoom.type = Room.TYPES.SPAWN;
        this.map.updateRoom(spawnRoom);

        this.map.currentCol = spawnRoom.col;
        this.map.currentRow = spawnRoom.row;

        // remove the spawn room from the list of available deadends
        deadends = deadends.filter(room => room !== spawnRoom);

        // sort deadends by their distance from the spawn room
        // this will let us place rarer events further away from spawn
        deadends.sort((roomA, roomB) => {
            const distanceA = Math.abs(roomA.col - spawnRoom.col) + Math.abs(roomA.row - spawnRoom.row);
            const distanceB = Math.abs(roomB.col - spawnRoom.col) + Math.abs(roomB.row - spawnRoom.row);
            return distanceB - distanceA;       
        });

        // place the exit room at the farthest deadend from the spawn room
        // using shift() so that the exit room is removed from the list of available deadends
        const exitRoom = deadends.shift();

        exitRoom.type = Feature.TYPES.EXIT;
        this.map.updateRoom(exitRoom);

        while(deadends.length > 0)
        {
            // pick a random deadend but with bias towards ones that are further from spawn
            // this works because the deadends are sorted by distance from the spawn room
            // and biasedRange() will return a number closer to the minimum value
            const index = SharedChance.biasedRange(0, deadends.length - 1);
            const room = deadends[index];

            // remove the chosen deadend from the list of available deadends
            deadends.splice(index, 1);

            if(this.map.undiscoveredLegendaryTreasures < this.map.maxLegendaryTreasures)
            {
                // legendary treasures
                this.generateEncounter(room, Feature.TYPES.TREASURE_LEGENDARY);
                this.map.undiscoveredLegendaryTreasures++;
            }
            else if(this.map.undefeatedLegendaryEnemies < this.map.maxLegendaryEnemies)
            {
                // legendary enemies
                this.generateEncounter(room, Encounter.TYPES.ENEMY_LEGENDARY);
                this.map.undefeatedLegendaryEnemies++;
            }
            else if(this.map.undefeatedEpicEnemies < this.map.maxEpicEnemies)
            {
                // epic enemies
                this.generateEncounter(room, Encounter.TYPES.ENEMY_EPIC);
                this.map.undefeatedEpicEnemies++;
            }
            else if(this.map.undiscoveredEpicTreasures < this.map.maxEpicTreasures)
            {
                // epic treasures
                this.generateEncounter(room, Feature.TYPES.TREASURE_EPIC);
                this.map.undiscoveredEpicTreasures++;
            }
            else if(this.map.undefeatedRareEnemies < this.map.maxRareEnemies)
            {
                // rare enemies
                this.generateEncounter(room, Encounter.TYPES.ENEMY_RARE);
                this.map.undefeatedRareEnemies++;
            }
            else if(this.map.undiscoveredRareTreasures < this.map.maxRareTreasures)
            {
                // rare treasures
                this.generateEncounter(room, Feature.TYPES.TREASURE_RARE);
                this.map.undiscoveredRareTreasures++;
            }
            else
            {
                // we haven't exhausted the deadends,
                // but we have placed everything we need to
                break;
            }
        }

        // explore the spawn room
        this.map.exploreRoom(spawnRoom.col, spawnRoom.row);

        // handle any debug requirements
        this.handleDebug();

        // set the map state to ready
        this.map.state = Map.STATES.MAP_READY;
    }

    generateFoundation(rooms)
    {
        // choose a random room towards the top left of the map to start the foundation
        const startX = SharedChance.roll(0, 4);
        const startY = SharedChance.roll(0, 4);
        const startRoom = this.map.getRoom(startX, startY);

        // choose a random room towards the bottom right of the map to finish the foundation
        const finishX = this.map.gridCols - 1 - SharedChance.roll(0, 4);
        const finishY = this.map.gridRows - 1 - SharedChance.roll(0, 4);
        const finishRoom = this.map.getRoom(finishX, finishY);
        
        // generate a path between the start and finish rooms
        const foundationPath = this.generatePath(startRoom, finishRoom);

        // flag the start and end room of the foundation as deadends
        startRoom.type = Room.TYPES.DEADEND;
        this.map.updateRoom(startRoom);

        finishRoom.type = Room.TYPES.DEADEND;
        this.map.updateRoom(finishRoom);

        // add all of the rooms along the foundation path to the list of populated rooms
        rooms.push(...foundationPath);
    }

    generatePath(start, destination)
    {
        const path = [];
        
        let currentCol = start.col;
        let currentRow = start.row;

        // we will randomly pick a heading (horizontal or vertical) every few steps
        // to ensure the path we create is more interesting
        let isMovingHorizontally = SharedChance.flip();
        let stepsSinceDirectionChange = 0;

        while(currentCol !== destination.col || currentRow !== destination.row)
        {
            // move towards the destination
            currentCol = (isMovingHorizontally)? Number.converge(currentCol, destination.col): currentCol;
            currentRow = (!isMovingHorizontally)? Number.converge(currentRow, destination.row): currentRow;

            // force a switch in direction if we can no longer move closer in the current direction
            isMovingHorizontally = (currentCol === destination.col)? false: isMovingHorizontally;
            isMovingHorizontally = (currentRow === destination.row)? true: isMovingHorizontally;
    
            path.push(this.map.getRoom(currentCol, currentRow));

            stepsSinceDirectionChange++;
            const distance = (isMovingHorizontally)? Math.abs(destination.row - currentRow): Math.abs(destination.col - currentCol);
            
            if(stepsSinceDirectionChange > 3 && distance > 3)
            {
                isMovingHorizontally = SharedChance.flip();
                stepsSinceDirectionChange = 0;
            }
        }

        for (const room of path)
        {
            room.type = (room.type === Room.TYPES.EMPTY)? Room.TYPES.REGULAR: room.type;
            this.map.updateRoom(room);
        }

        return path;
    }

    generateCorridors(rooms)
    {
        const targetCorridors = SharedChance.range(50, 60);
        let actualCorridors = 0;
        let attempts = 0;

        while(actualCorridors < targetCorridors && attempts < 1000)
        {
            const startRoom = rooms[SharedChance.roll(1, rooms.length) - 1];
            const direction = DIRECTIONS.getRandomDirection(SharedChance);
            const maxLength = SharedChance.range(6, 16);

            const corridor = this.generateCorridor(startRoom, maxLength, direction, []);

            if(corridor.length > 1)
            {
                const firstRoom = corridor.shift();
                const lastRoom = corridor[corridor.length - 1];

                // we use shift() to retrieve the first room in the corridor
                // so that it is also removed from the list of rooms in the corridor
                // this is because the first room was an existing room that we do not
                // want to add to the list of populated rooms twice

                // mark the first room in the cooridor as a regular room
                // it may have previously been a deadend
                firstRoom.type = Room.TYPES.REGULAR;
                this.map.updateRoom(firstRoom);

                // mark the last room in the cooridor as a deadend
                // deadends are important as they are where most encounters will be place
                lastRoom.type = Room.TYPES.DEADEND;
                this.map.updateRoom(lastRoom);

                // add all of the rooms in the corridor to the list of populated rooms
                // (except the first room, which already existed)
                rooms.push(...corridor);
                
                actualCorridors++;
            }

            attempts++;
        }
    }

    generateCorridor(room, maxLength, direction, corridor)
    {
        let neighbors = [];

        switch(direction)
        {
            case DIRECTIONS.NORTH:
                neighbors.push(this.map.getRoom(room.col, room.row - 1));
                neighbors.push(this.map.getRoom(room.col + 1, room.row - 1));
                neighbors.push(this.map.getRoom(room.col - 1, room.row - 1));
                break;

            case DIRECTIONS.EAST:
                neighbors.push(this.map.getRoom(room.col + 1, room.row));
                neighbors.push(this.map.getRoom(room.col + 1, room.row + 1));
                neighbors.push(this.map.getRoom(room.col + 1, room.row - 1));
                break;

            case DIRECTIONS.SOUTH:
                neighbors.push(this.map.getRoom(room.col, room.row + 1));
                neighbors.push(this.map.getRoom(room.col + 1, room.row + 1));
                neighbors.push(this.map.getRoom(room.col - 1, room.row + 1));
                break;

            case DIRECTIONS.WEST:
                neighbors.push(this.map.getRoom(room.col - 1, room.row));
                neighbors.push(this.map.getRoom(room.col - 1, room.row + 1));
                neighbors.push(this.map.getRoom(room.col - 1, room.row - 1));
                break;
        }

        // remove any neighbors that are null (off the edge of the map)
        neighbors = neighbors.filter(neighbor => neighbor !== null);

        // there should be either exactly 3 neighbors or exactly none (map edge)
        if(neighbors.length !== 0 && neighbors.length !== 3) { return corridor; }

        // if any of the neighbors are not empty, we have gone as far as we can go
        if(neighbors.some(neighbor => neighbor.type !== Room.TYPES.EMPTY)) { return corridor; }

        if (room.type === Room.TYPES.EMPTY)
        {
            room.type = Room.TYPES.REGULAR;
            this.map.updateRoom(room);
        }

        corridor.push(room);

        if(neighbors.length === 0)
        { 
            // stop if we have reached the edge of the map
            return corridor;
        }
        else if(corridor.length >= maxLength + 1)
        {
            // stop if we have reached the maximum length of the corridor
            // (+1 because of the initial room)
            return corridor;
        }
        else
        {
            // continue trying to extend the corridor in the desired direction
            return this.generateCorridor(neighbors[0], maxLength, direction, corridor);
        }
    }

    generateLoops(count, deadends)
    {
        // randomise the order of the deadends so that the loops are not always in the same place
        deadends.sort(() => Math.random() - 0.5);

        let loops = count;
        let loopAttempts = 0;

        const allDirectionDeltas = [
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.NORTH),
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.EAST),
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.SOUTH),
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.WEST),
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.NORTH_EAST),
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.SOUTH_EAST),
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.SOUTH_WEST),
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.NORTH_WEST)
        ];

        const keyDirectionDeltas = [
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.NORTH),
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.EAST),
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.SOUTH),
            DIRECTIONS.getDirectionDeltas(DIRECTIONS.WEST)
        ];
 
        for(const room of deadends)
        {
            if(loops <= 0) { break; }
            if(loopAttempts > 100) { break; }

            // count how many adjoining rooms are not empty
            // we count nulls as not empty because they are off the edge of the map
            let adjoiningRoomCount = 0;
            for (const delta of allDirectionDeltas)
            {
                const neighbor = this.map.getRoom(room.col + delta.col, room.row + delta.row);

                adjoiningRoomCount += (neighbor === null || neighbor.type !== Room.TYPES.EMPTY)? 1: 0;
            }

            // we only want to create loops on deadends with one adjoining room,
            // otherwise we would end up with overlapping corridors
            if(adjoiningRoomCount !== 1) { continue; }

            // check in each of the key directions to see if there is an opportunity to close the loop
            // we only want to close loops where there is a single space seperating two corridors
            for (const delta of keyDirectionDeltas)
            {
                const midRoom = this.map.getRoom(room.col + delta.col, room.row + delta.row);
                const endRoom = this.map.getRoom(room.col + (2 * delta.col), room.row + (2 * delta.row));

                if(midRoom !== null && midRoom.type == Room.TYPES.EMPTY && endRoom !== null && endRoom.type != Room.TYPES.EMPTY)
                {
                    // update the middle room to be a regular room
                    // to close the loop
                    midRoom.type = Room.TYPES.REGULAR;
                    this.map.updateRoom(midRoom);

                    // update the start and end rooms to be regular rooms
                    // as they are no longer deadends
                    room.type = Room.TYPES.REGULAR;
                    this.map.updateRoom(room);

                    endRoom.type = Room.TYPES.REGULAR;
                    this.map.updateRoom(endRoom);

                    loops--;
                    break;
                }
            }

            loopAttempts++;
        }
    }
    
    generateEncounter(room, type)
    {
        room.type = type;
        this.map.updateRoom(room);
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

        // explore all the rooms
        for(let row = 0; row < this.map.gridRows; row++)
        {
            for(let col = 0; col < this.map.gridCols; col++)
            {
                this.map.exploreRoom(col, row);
            }
        }
    }

}