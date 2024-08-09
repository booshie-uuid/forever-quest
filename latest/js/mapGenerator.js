class MapGenerator
{
    constructor(map, chance)
    {
        this.map = map;
        this.chance = chance;
    }

    initializeGrid()
	{
		this.map.grid = this.map.grid || [];

        for (let gridY = 0; gridY < this.map.gridRows; gridY++)
		{
			this.map.grid[gridY] = this.map.grid[gridY] || [];

            for (let gridX = 0; gridX < this.map.gridCols; gridX++)
			{
                this.map.grid[gridY][gridX] = Room.generateEmptyRoom(gridX, gridY, 0).compress();
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
		const spawnRoom = this.chance.pick(deadends);

		spawnRoom.type = Room.TYPES.SPAWN;
		this.map.updateRoom(spawnRoom);

        this.map.currentX = spawnRoom.x;
        this.map.currentY = spawnRoom.y;

		// sort deadends by their distance from the spawn room
        // this will let us place rarer events further away from spawn
		deadends.sort((roomA, roomB) => {
			const distanceA = Math.abs(roomA.x - spawnRoom.x) + Math.abs(roomA.y - spawnRoom.y);
			const distanceB = Math.abs(roomB.x - spawnRoom.x) + Math.abs(roomB.y - spawnRoom.y);
			return distanceB - distanceA;       
        });

        // place the exit room at the farthest deadend from the spawn room
        const exitRoom = deadends.shift();

		exitRoom.type = Feature.TYPES.EXIT;
		this.map.updateRoom(exitRoom);

        this.map.exploreRoom(exitRoom.x, exitRoom.y);

        while(deadends.length > 0)
        {
            // pick a random deadend but with bias towards ones that are further from spawn
            // this works because the deadends are sorted by distance from the spawn room
            // and biasedRange() will return a number closer to the minimum value
            const index = this.chance.biasedRange(0, deadends.length - 1);
            const room = deadends[index];

            // remove the chosen deadend from the list of deadends so we don't pick it again
            deadends.splice(index, 1);

            // legendary treasures
            if(this.map.undiscoveredLegendaryTreasures < this.map.maxLegendaryTreasures)
            {
                this.generateEncounter(room, Feature.TYPES.TREASURE_LEGENDARY);
                this.map.undiscoveredLegendaryTreasures++;
            }
            // legendary enemies
            else if(this.map.undefeatedLegendaryEnemies < this.map.maxLegendaryEnemies)
            {
                this.generateEncounter(room, Encounter.TYPES.ENEMY_LEGENDARY);
                this.map.undefeatedLegendaryEnemies++;
            }
            // epic enemies
            else if(this.map.undefeatedEpicEnemies < this.map.maxEpicEnemies)
            {
                this.generateEncounter(room, Encounter.TYPES.ENEMY_EPIC);
                this.map.undefeatedEpicEnemies++;
            }
            // epic treasures
            else if(this.map.undiscoveredEpicTreasures < this.map.maxEpicTreasures)
            {
                this.generateEncounter(room, Feature.TYPES.TREASURE_EPIC);
                this.map.undiscoveredEpicTreasures++;
            }
            // rare treasures
            else if(this.map.undiscoveredRareTreasures < this.map.maxRareTreasures)
            {
                this.generateEncounter(room, Feature.TYPES.TREASURE_RARE);
                this.map.undiscoveredRareTreasures++;
            }
            // rare enemies
            else if(this.map.undefeatedRareEnemies < this.map.maxRareEnemies)
            {
                this.generateEncounter(room, Encounter.TYPES.ENEMY_RARE);
                this.map.undefeatedRareEnemies++;
            }
            else
            {
                // we haven't exhausted the deadends,
                // but we have placed everything we need to
                break;
            }
        }

        // explore the spawn room
		this.map.exploreRoom(spawnRoom.x, spawnRoom.y);

        // explore all the rooms if debug mode is enabled
		if(this.map.debug)
		{
			for(let y = 0; y < this.map.gridRows - 1; y++)
			{
				for(let x = 0; x < this.map.gridCols - 1; x++)
				{
					this.map.exploreRoom(x, y);
				}
			}
		}

        // set the map state to ready
		this.map.state = Map.STATES.MAP_READY;
	}

    generateFoundation(rooms)
    {
        // choose a random room towards the top left of the map to start the foundation
		const startX = this.chance.roll(0, 4);
		const startY = this.chance.roll(0, 4);
		const startRoom = this.map.getRoom(startX, startY);

        // choose a random room towards the bottom right of the map to finish the foundation
		const finishX = this.map.gridCols - 1 - this.chance.roll(0, 4);
		const finishY = this.map.gridRows - 1 - this.chance.roll(0, 4);
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
		
		let currentX = start.x;
		let currentY = start.y;

        // we will randomly pick a heading (horizontal or vertical) every few steps
        // to ensure the path we create is more interesting
		let isMovingHorizontally = this.chance.flip();
		let stepsSinceDirectionChange = 0;
		
		const move = (current, target) => (current < target ? current + 1 : current > target ? current - 1 : current);

		while(currentX !== destination.x || currentY !== destination.y)
		{
			// move towards the destination
            currentX = (isMovingHorizontally)? move(currentX, destination.x): currentX;
            currentY = (!isMovingHorizontally)? move(currentY, destination.y): currentY;

			// force a switch in direction if we can no longer move closer in the current direction
            isMovingHorizontally = (currentX === destination.x)? false: isMovingHorizontally;
            isMovingHorizontally = (currentY === destination.y)? true: isMovingHorizontally;
	
			path.push(this.map.getRoom(currentX, currentY));

			stepsSinceDirectionChange++;
			const distance = (isMovingHorizontally)? Math.abs(destination.y - currentY): Math.abs(destination.x - currentX);
			
			if(stepsSinceDirectionChange > 3 && distance > 3)
			{
				isMovingHorizontally = this.chance.flip();
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
		const targetCorridors = this.chance.range(50, 60);
        let actualCorridors = 0;
		let attempts = 0;

		while(actualCorridors < targetCorridors && attempts < 1000)
		{
			const startRoom = rooms[this.chance.roll(1, rooms.length) - 1];
            const direction = DIRECTIONS.getRandomDirection(this.chance);
			const maxLength = this.chance.range(6, 16);

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
				neighbors.push(this.map.getRoom(room.x, room.y - 1));
				neighbors.push(this.map.getRoom(room.x + 1, room.y - 1));
				neighbors.push(this.map.getRoom(room.x - 1, room.y - 1));
				break;

			case DIRECTIONS.EAST:
				neighbors.push(this.map.getRoom(room.x + 1, room.y));
				neighbors.push(this.map.getRoom(room.x + 1, room.y + 1));
				neighbors.push(this.map.getRoom(room.x + 1, room.y - 1));
				break;

			case DIRECTIONS.SOUTH:
				neighbors.push(this.map.getRoom(room.x, room.y + 1));
				neighbors.push(this.map.getRoom(room.x + 1, room.y + 1));
				neighbors.push(this.map.getRoom(room.x - 1, room.y + 1));
				break;

			case DIRECTIONS.WEST:
				neighbors.push(this.map.getRoom(room.x - 1, room.y));
				neighbors.push(this.map.getRoom(room.x - 1, room.y + 1));
				neighbors.push(this.map.getRoom(room.x - 1, room.y - 1));
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
                const neighbor = this.map.getRoom(room.x + delta.x, room.y + delta.y);

                adjoiningRoomCount += (neighbor === null || neighbor.type !== Room.TYPES.EMPTY)? 1: 0;
            }

            // we only want to create loops on deadends with one adjoining room,
            // otherwise we would end up with overlapping corridors
            if(adjoiningRoomCount !== 1) { continue; }

            // check in each of the key directions to see if there is an opportunity to close the loop
            // we only want to close loops where there is a single space seperating two corridors
            for (const delta of keyDirectionDeltas)
            {
                const midRoom = this.map.getRoom(room.x + delta.x, room.y + delta.y);
                const endRoom = this.map.getRoom(room.x + (2 * delta.x), room.y + (2 * delta.y));

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
}