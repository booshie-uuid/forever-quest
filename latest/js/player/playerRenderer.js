class PlayerRenderer
{
    constructor(parentPlayer)
    {
        this.parent = parentPlayer;
        this.texture = new GameTexture(`player.png`);
    }

    update(timestamp)
    {
        if(this.texture.isReady)
        {
            this.draw();
        }
    }

    draw()
    {
        // yield if there is no map for the player to interact with
        if(GAME.map === null || GAME.map.state !== Map.STATES.MAP_READY) { return; }

        this.drawHighlights();
    }

    drawHighlights()
    {
        // highlight intended movement path
        this.drawPathHighlghts();

        // highlight current location
        const tile = GAME.map.getTile(this.parent.col, this.parent.row);

        // yield if the player is not located in a valid tile
        if(tile === null) { return; }

        const drawX = GAME.map.renderer.drawOffsetX;
        const drawY = GAME.map.renderer.drawOffsetY;
        const drawSize = GAME.map.renderer.outerDrawSize;

        GAME.gfx.main.drawSprite(this.texture, 1, 1, drawX, drawY, drawSize, drawSize);
        //GAME.gfx.main.drawRectangleOutline(drawX, drawY, drawSize, drawSize, "#fab40b", 2);
    }

    drawPathHighlghts()
    {
        if(this.parent.path !== null)
        {
            GAME.gfx.main.context.strokeStyle = "#FF0000";
            GAME.gfx.main.context.lineWidth = 2;

            GAME.gfx.main.context.beginPath();

            const path = this.parent.path.toReversed();

            for(let i = 0; i < path.length; i++)
            {
                const tile = path[i].tile;
                const previousTile = (i > 0)? path[i - 1].tile: this.parent.getTile();

                const screenPos = GAME.map.renderer.getScreenPos(tile);
                const drawX = screenPos.x - GAME.map.renderer.transitionX;
                const drawY = screenPos.y - GAME.map.renderer.transitionY;
                const drawSize = GAME.map.renderer.outerDrawSize;

                let direction = DIRECTIONS.NONE;

                if(tile.col < previousTile.col && tile.row == previousTile.row) { direction = DIRECTIONS.WEST; }
                else if(tile.col > previousTile.col && tile.row == previousTile.row) { direction = DIRECTIONS.EAST; }
                else if(tile.col == previousTile.col && tile.row < previousTile.row) { direction = DIRECTIONS.NORTH; }
                else if(tile.col == previousTile.col && tile.row > previousTile.row) { direction = DIRECTIONS.SOUTH; }

                const nextTile = (i + 1 < path.length)? path[i + 1].tile: null;

                if(nextTile !== null)
                {
                    if (direction == DIRECTIONS.WEST && nextTile.row < tile.row) { direction = DIRECTIONS.NORTH_WEST; }
                    else if (direction == DIRECTIONS.WEST && nextTile.row > tile.row) { direction = DIRECTIONS.SOUTH_WEST; }
                    else if (direction == DIRECTIONS.EAST && nextTile.row < tile.row) { direction = DIRECTIONS.NORTH_EAST; }
                    else if (direction == DIRECTIONS.EAST && nextTile.row > tile.row) { direction = DIRECTIONS.SOUTH_EAST; }
                    else if (direction == DIRECTIONS.NORTH && nextTile.col < tile.col) { direction = DIRECTIONS.NORTH_WEST; }
                    else if (direction == DIRECTIONS.NORTH && nextTile.col > tile.col) { direction = DIRECTIONS.NORTH_EAST; }
                    else if (direction == DIRECTIONS.SOUTH && nextTile.col < tile.col) { direction = DIRECTIONS.SOUTH_WEST; }
                    else if (direction == DIRECTIONS.SOUTH && nextTile.col > tile.col) { direction = DIRECTIONS.SOUTH_EAST; }
                }

                if(direction == DIRECTIONS.NONE) { continue; }

                let spriteX = 0;
                let spriteY = 34;

                switch(direction)
                {
                    case DIRECTIONS.NORTH: spriteX = 1; break;
                    case DIRECTIONS.EAST: spriteX = 34; break;
                    case DIRECTIONS.SOUTH: spriteX = 67; break;
                    case DIRECTIONS.WEST: spriteX = 100; break;
                    case DIRECTIONS.NORTH_EAST: spriteX = 133; break;
                    case DIRECTIONS.SOUTH_EAST: spriteX = 166; break;
                    case DIRECTIONS.SOUTH_WEST: spriteX = 199; break;
                    case DIRECTIONS.NORTH_WEST: spriteX = 232; break;
                }

                GAME.gfx.main.drawSprite(this.texture, spriteX, spriteY, drawX, drawY, drawSize, drawSize);
                //GAME.gfx.main.drawRectangleOutline(drawX, drawY, drawSize, drawSize, (i > 0)? "#94702c" : "red", 2, [3, 5]);
            }

            GAME.gfx.main.context.stroke();
        }
    }
}