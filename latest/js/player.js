class Player extends GameEntity
{
    constructor(name)
    {
        super(GameEntity.TYPE_PLAYER, name);

        this.map = null;
        this.col = 0;
        this.row = 0;

        this.path = null;
        this.isMovingManually = false;
        this.movementDelay = 180;
        this.lastMoved = Date.now();

        this.moveDirection = DIRECTIONS.NONE;
    }

    setMap(map)
    {
        this.map = map;

        this.col = this.map.spawnMapTile.col;
        this.row = this.map.spawnMapTile.row;
    }

    update()
    {
        // yield if the player is not assigned to a map
        if(this.map === null) { return; }

        if(this.map.renderer.transitionX == 0 && this.map.renderer.transitionY == 0)
        {
            this.moveManually();
            this.moveOnPath();
        }

        if(this.col != this.map.currentCol || this.row != this.map.currentRow)
        {
            

            this.map.renderer.transitionX = (this.map.currentCol < this.col)? -32: (this.map.currentCol > this.col)? 32: 0;
            this.map.renderer.transitionY = (this.map.currentRow < this.row)? -32: (this.map.currentRow > this.row)? 32: 0;

            this.map.currentCol = this.col;
            this.map.currentRow = this.row;
        }

        this.draw();
    }

    getTile()
    {
        return this.map.getTile(this.col, this.row);
    }

    setDestination(tile)
    {
        // yield if the player is not assigned to a map
        if(this.map === null) { return; }

        // yield if the tile is empty or unexplored
        if(tile.type == MapTile.TYPES.EMPTY) { return; }

        const startingMapTile = this.getTile();
        const finishingMapTile = tile;

        this.path = this.map.pathFinder.calculatePath(startingMapTile, finishingMapTile);
        this.path.pop();
    }

    moveManually()
    {
        // yield if the player is not assigned to a map
        // or if the player is not moving manually
        if(this.map === null || !this.isMovingManually) { return; }

        // yield if the player has moved to recently
        if(Date.now() - this.lastMoved < this.movementDelay) { return; }

        const delta = DIRECTIONS.getDirectionDeltas(this.moveDirection);

        const tile = this.getTile();

        // yield if the player is not located in a valid tile
        if(tile === null) { return; }

        const newCol = tile.col + delta.col;
        const newRow = tile.row + delta.row;

        const newMapTile = this.map.getTile(newCol, newRow);

        // yield if the new location is empty or otherwise not a valid tile
        //if(newMapTile === null) { return; }
        if(newMapTile === null || newMapTile.type == MapTile.TYPES.EMPTY || newMapTile.type == MapTile.TYPES.WALL) { return; }

        // update the players location
        this.col = newCol;
        this.row = newRow;
        
        this.lastMoved = Date.now();

        // explore the new location
        this.map.exploreMapTile(newCol, newRow);
    }

    moveOnPath()
    {
        // yield if the player is not assigned to a map
        if(this.map === null) { return; }

        // yield if the player has no path to follow
        if(this.path === null || this.path.length == 0) return;

        // yield if the player has moved to recently
        if(Date.now() - this.lastMoved < this.movementDelay) { return; }

        const tile = this.path.pop().tile;

        this.col = tile.col;
        this.row = tile.row;

        this.map.exploreMapTile(tile.col, tile.row);

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

    draw()
    {
        // yield if the player is not assigned to a map
        if(this.map === null) { return; }

        this.drawHighlights();
    }

    drawHighlights()
    {
        // highlight intended movement path
        this.drawPathHighlghts();

        // highlight current location
        const tile = this.map.getTile(this.col, this.row);

        // yield if the player is not located in a valid tile
        if(tile === null) { return; }

        const drawX = this.map.renderer.drawOffsetX;
        const drawY = this.map.renderer.drawOffsetY;
        const drawSize = this.map.renderer.outerDrawSize;

        GAME.gfx.main.drawRectangleOutline(drawX, drawY, drawSize, drawSize, "#fab40b", 2);
    }

    drawPathHighlghts()
    {
        if(this.path !== null)
        {
            GAME.gfx.main.context.strokeStyle = "#FF0000";
            GAME.gfx.main.context.lineWidth = 2;

            GAME.gfx.main.context.beginPath();

            for(let i = 0; i < this.path.length; i++)
            {
                const tile = this.path[i].tile;

                const drawX = tile.renderX + this.map.renderer.drawOffsetX;
                const drawY = tile.renderY + this.map.renderer.drawOffsetY;
                const drawSize = this.map.renderer.outerDrawSize;

                GAME.gfx.main.drawRectangleOutline(drawX, drawY, drawSize, drawSize, "#94702c", 2, [3, 5]);
            }

            GAME.gfx.main.context.stroke();
        }
    }


}