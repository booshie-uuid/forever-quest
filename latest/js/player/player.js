class Player extends GameEntity
{
    constructor(name)
    {
        super(GameEntity.TYPE_PLAYER, name);

        this.col = 0;
        this.row = 0;

        this.path = null;
        this.isMovingManually = false;
        this.movementDelay = 180;
        this.lastMoved = Date.now();

        this.renderer = new PlayerRenderer(this);

        this.moveDirection = DIRECTIONS.NONE;
    }

    joinMap()
    {
        this.col = GAME.map.spawnMapTile.col;
        this.row = GAME.map.spawnMapTile.row;
    }

    update(timestamp)
    {
        // yield if there is no map for the player to interact with
        if(GAME.map === null || GAME.map.state !== Map.STATES.MAP_READY) { return; }

        if(GAME.map.renderer.transitionX == 0 && GAME.map.renderer.transitionY == 0)
        {
            this.moveManually();
            this.moveOnPath();
        }

        if(this.col != GAME.map.currentCol || this.row != GAME.map.currentRow)
        {
            GAME.map.renderer.transitionX = (GAME.map.currentCol < this.col)? -32: (GAME.map.currentCol > this.col)? 32: 0;
            GAME.map.renderer.transitionY = (GAME.map.currentRow < this.row)? -32: (GAME.map.currentRow > this.row)? 32: 0;

            GAME.map.currentCol = this.col;
            GAME.map.currentRow = this.row;
        }

        this.renderer.update(timestamp);
    }

    getTile()
    {
        return GAME.map.getTile(this.col, this.row);
    }

    setDestination(tile)
    {
        // yeild if there is no map for the player to interact with
        if(GAME.map === null || GAME.map.state !== Map.STATES.MAP_READY) { return; }

        // yield if the tile is empty or unexplored
        if(tile.type == MapTile.TYPES.EMPTY) { return; }

        const startingMapTile = this.getTile();
        const finishingMapTile = tile;

        this.path = GAME.map.pathFinder.calculatePath(startingMapTile, finishingMapTile);
        this.path.pop();
    }

    moveManually()
    {
        // yield if there is no map for the player to interact with
        // or if the player is not moving manually
        if(GAME.map === null || GAME.map.state !== Map.STATES.MAP_READY || !this.isMovingManually) { return; }

        // yield if the player has moved to recently
        if(Date.now() - this.lastMoved < this.movementDelay) { return; }

        const delta = DIRECTIONS.getDirectionDeltas(this.moveDirection);

        const tile = this.getTile();

        // yield if the player is not located in a valid tile
        if(tile === null) { return; }

        const newCol = tile.col + delta.col;
        const newRow = tile.row + delta.row;

        const newMapTile = GAME.map.getTile(newCol, newRow);

        // yield if the new location is empty or otherwise not a valid tile
        if(newMapTile === null || newMapTile.type == MapTile.TYPES.EMPTY || !newMapTile.isTraversable) { return; }

        // update the players location
        this.col = newCol;
        this.row = newRow;
        
        this.lastMoved = Date.now();

        // explore the new location
        GAME.map.exploreMapTile(newCol, newRow);
    }

    moveOnPath()
    {
        // yeild if there is no map for the player to interact with
        if(GAME.map === null || GAME.map.state !== Map.STATES.MAP_READY) { return; }

        // yield if the player has no path to follow
        if(this.path === null || this.path.length == 0) return;

        // yield if the player has moved to recently
        if(Date.now() - this.lastMoved < this.movementDelay) { return; }

        const tile = this.path.pop().tile;

        this.col = tile.col;
        this.row = tile.row;

        GAME.map.exploreMapTile(tile.col, tile.row);

        this.lastMoved = Date.now();
    }

    handleKeyboardInput(key, isKeyDown)
    {
        key = key.toLowerCase();

        const movementKeys = ["arrowup", "arrowright", "arrowdown", "arrowleft", "w", "d", "s", "a"];

        // handle movement keys
        if(movementKeys.includes(key)) { return this.handleKeyboardMovement(key, isKeyDown); }

        // if the key press was not handled by any of the above cases,
        // return false to indicate the key press was not handled
        return false;
    }

    handleKeyboardMovement(key, isKeyDown)
    {
        if(this.isMovingManually && !isKeyDown)
        {
            // if the player is moving manually and the key is no longer down,
            // check if the key corresponds to the direction the player is moving
            // and stop the players movment if that is the case

            // it is important we check the released key corresponds to the direction
            // as the player may press a new direction before releasing the old one

            switch(key)
            {
                case "arrowup":
                case "w":
                    this.isMovingManually = (this.moveDirection == DIRECTIONS.NORTH)? false: this.isMovingManually;
                    break;
                
                case "arrowright":
                case "d":
                    this.isMovingManually = (this.moveDirection == DIRECTIONS.EAST)? false: this.isMovingManually;
                    break;

                case "arrowdown":
                case "s":
                    this.isMovingManually = (this.moveDirection == DIRECTIONS.SOUTH)? false: this.isMovingManually;
                    break;

                case "arrowleft":
                case "a":
                    this.isMovingManually = (this.moveDirection == DIRECTIONS.WEST)? false: this.isMovingManually;
                    break;

                default: break;
            }

            // update the direction of the player to none if we stopped the players movement
            this.moveDirection = (this.isMovingManually)? this.moveDirection: DIRECTIONS.NONE;

            // return an indicator of whether the key press was handled
            return (this.moveDirection == DIRECTIONS.NONE);
        }
        else if(isKeyDown)
        {
            // update the direction of the player to reflect the key pressed

            switch(key)
            {
                case "arrowup":
                case "w":
                    this.moveDirection = DIRECTIONS.NORTH;
                    break;
                case "arrowright":
                case "d":
                    this.moveDirection = DIRECTIONS.EAST;
                    break;
                case "arrowdown":
                case "s":
                    this.moveDirection = DIRECTIONS.SOUTH;
                    break;
                case "arrowleft":
                case "a":
                    this.moveDirection = DIRECTIONS.WEST;
                    break;
            }

            // if the player is not already moving, push back the last moved time
            // so that there is no artificial input delay
            if(!this.isMovingManually && this.moveDirection != DIRECTIONS.NONE)
            {
                this.lastMoved = Date.now() - this.movementDelay - 5;
            }

            // set the player to be moving manually (assuming the key press was actually handled)
            this.isMovingManually = (this.moveDirection != DIRECTIONS.NONE);

            // clear any path the player may have been following automatically
            if(this.isMovingManually) { this.path = null; }

            // return an indicator of whether the key press was handled
            return (this.moveDirection != DIRECTIONS.NONE);
        }
        else
        {
            // return false to indicate the key press was not handled
            return false;
        }
    }
}