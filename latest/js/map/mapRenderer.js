class MapRenderer
{
    constructor(parentMap)
    {
        this.parent = parentMap;
        this.texture = parentMap.texture;
        this.theme = parentMap.biome.theme;

        this.drawOffsetX = 12;
        this.drawOffsetY = 12;
        this.outerDrawSize = 32;
        this.innerDrawSize = 32;

        this.targetDrawOffsetX = this.drawOffsetX;
        this.targetDrawOffsetY = this.drawOffsetY;
       
        this.transitionX = 0;
        this.transitionY = 0;

        this.isLightingEnabled = true;

        this.lastUpdate = performance.now();

        this.isRenderStale = true;

        this.display = {
            drawWidth: GAME.gfx.main.canvas.width,
            drawHeight: GAME.gfx.main.canvas.height,
            gridWidth: Math.floor(GAME.gfx.main.canvas.width / this.outerDrawSize),
            gridHeight: Math.floor(GAME.gfx.main.canvas.height / this.outerDrawSize),
            gridOffsetCols: 0,
            gridOffsetRows: 0
        };

        this.buffer = {};
    }

    renderMap()
    {
        if(!this.isRenderStale) { return; }

        for(const row of this.parent.grid)
        {
            for(const tile of row)
            {
                this.renderTile(tile);
            }
        }

        this.isRenderStale = false;
    }

    getScreenPos(tile)
    {
        const rowDelta = tile.col - this.parent.currentCol;
        const colDelta = tile.row - this.parent.currentRow;

        const x = (rowDelta * this.outerDrawSize) + this.drawOffsetX;
        const y = (colDelta * this.outerDrawSize) + this.drawOffsetY;

        return { x, y };
    }

    calcDrawOffsetX(playerCol, playerRow, snap = false)
    {
        this.targetDrawOffsetX = Math.floor((this.display.drawWidth - this.outerDrawSize) / 2);
        this.targetDrawOffsetY = Math.floor((this.display.drawHeight - this.outerDrawSize) / 2);

        if(snap)
        {
            this.drawOffsetX = this.targetDrawOffsetX;
            this.drawOffsetY = this.targetDrawOffsetY;
        }
    }

    getPosFromScreen(x, y)
    {
        return {
            col: this.parent.currentCol + Math.floor((x - this.drawOffsetX) / this.outerDrawSize),
            row: this.parent.currentRow + Math.floor((y - this.drawOffsetY) / this.outerDrawSize)
        };
    }

    getTileFromScreen(x, y)
    {
        const pos = this.getPosFromScreen(x, y);

        return this.parent.getTile(pos.col, pos.row);
    }

    update(timestamp)
    {
        let increment = (timestamp - this.lastUpdate) * (160 / 1000);
        increment = Math.round(increment);
        
        if(this.transitionX != 0)
        {
            this.transitionX = Number.converge(this.transitionX, 0, increment);
        }

        if(this.transitionY != 0)
        {
            this.transitionY = Number.converge(this.transitionY, 0, increment);
        }

        this.lastUpdate = timestamp;

        this.draw();
    }

    draw()
    {
        GAME.gfx.main.fillBackground(this.theme.backgroundColor);

        this.drawMap();
        this.drawFog();
    }

    renderSprite(renderX, renderY, spriteCol, spriteRow)
    {
        if(spriteCol === null || spriteRow === null || isNaN(spriteCol) || isNaN(spriteRow) || spriteCol < 0 || spriteRow < 0) { return; }

        // sprite sheets don't currently have full set of rows, so adjust for the missing rows
        spriteRow = (spriteRow >= 10)? spriteRow - 5: spriteRow;

        const spriteX = 34 + (spriteCol * 33);
        const spriteY = 1 + (spriteRow * 33);

        GAME.gfx.buffer.drawSprite(this.texture, spriteX, spriteY, renderX, renderY, MapTile.TILE_SIZE, MapTile.TILE_SIZE);
    }

    renderTile(tile)
    {
        const renderX = tile.renderX;
        const renderY = tile.renderY;

        const type = tile.type;

        if(type == MapTile.TYPES.EMPTY || type == MapTile.TYPES.DEBUG)
        {
            GAME.gfx.buffer.drawRectangle(renderX, renderY, this.outerDrawSize, this.outerDrawSize, this.theme.backgroundColor);
            return;
        }

        // render base sprite
        if(type == MapTile.TYPES.DOOR)
        {
            const col = (tile.isActivated)? 1 : 0;
            this.renderSprite(renderX, renderY, col, tile.spritePositions.baseRow);
        }
        else
        {
            this.renderSprite(renderX, renderY, tile.spritePositions.baseCol, tile.spritePositions.baseRow);
        }

        if(tile.isHorizontal() || !tile.canHideOverlays)
        {
            this.renderSprite(renderX, renderY, tile.spritePositions.overlayCol, tile.spritePositions.overlayRow);
        }

        if(tile.brightness < 1)
        {
            const alpha = 1.0 - tile.brightness;
            const color = "rgba(20, 14, 2, " + alpha + ")";

            GAME.gfx.buffer.drawRectangle(renderX, renderY, this.outerDrawSize, this.outerDrawSize, color);
        }
    }

    drawMap()
    {
        const tileSize = 32;
        const currentTile = this.parent.getTile(this.parent.currentCol, this.parent.currentRow);

        if(currentTile === null) { return; }

        //const renderX = Math.floor((this.display.width - this.outerDrawSize) / 2);
        //const renderY = Math.floor((this.display.height - this.outerDrawSize) / 2);

        const bufferOffsetX = (Math.floor(this.display.gridWidth / 2) + 1) * tileSize;
        const bufferOffsetY = (Math.floor(this.display.gridHeight / 2) + 1) * tileSize;

        const bufferX = currentTile.renderX - bufferOffsetX + this.transitionX;
        const bufferY = currentTile.renderY - bufferOffsetY + this.transitionY;

        const bufferWidth = (bufferOffsetX * 2);
        const bufferHeight = (bufferOffsetY * 2);

        const offsetDrawX = this.drawOffsetX - bufferOffsetX;// + this.transitionX;
        const offsetDrawY = this.drawOffsetY - bufferOffsetY;// + this.transitionY;

        GAME.gfx.main.copyCanvas(
            GAME.gfx.buffer.canvas,
            bufferX,
            bufferY,
            bufferWidth,
            bufferHeight,
            offsetDrawX,
            offsetDrawY,
            bufferWidth,
            bufferHeight
        );
    }

    drawFog()
    {
        if(this.isLightingEnabled === false) { return; }

        if(this.parent.currentCol < 0 || this.parent.currentRow < 0 || this.parent.currentCol >= this.parent.gridCols || this.parent.currentRow >= this.parent.gridRows) { return; }
        
        const colOffset = (Math.floor(this.display.gridWidth / 2) + 1) * this.outerDrawSize;
        const rowOffset = (Math.floor(this.display.gridHeight / 2) + 1) * this.outerDrawSize;

        const startCol = Number.limit(this.parent.currentCol - colOffset, 0, this.parent.gridCols - 1);
        const startRow = Number.limit(this.parent.currentRow - rowOffset, 0, this.parent.gridRows - 1);
        const finishCol = Number.limit(this.parent.currentCol + colOffset, 0, this.parent.gridCols - 1);
        const finishRow = Number.limit(this.parent.currentRow + rowOffset, 0, this.parent.gridRows - 1);

        for(let row = startRow; row <= finishRow; row++)
        {
            for(let col = startCol; col <= finishCol; col++)
            {
                const tile = this.parent.getTile(col, row);

                if(tile.isRevealed)
                {
                    tile.proposedBrightness = 1.0;
                }
                else
                {
                    const distance = Math.abs(col - this.parent.currentCol) + Math.abs(row - this.parent.currentRow);

                    tile.proposedBrightness = 1.0 - (distance / 16.0);
                }
            }
        }

        // update tiles around the player taking in to account line of sight
        for(let angle = 0; angle < 360; angle += 1)
        {
            const radians = angle * Math.PI / 180;
            let rayX = this.parent.currentCol + 0.5;
            let rayY = this.parent.currentRow + 0.5;

            const maxDistance = 6;
            let dim = false;

            for(let distance = 0; distance < maxDistance; distance += 1)
            {
                rayX += Math.cos(radians);
                rayY += Math.sin(radians);

                const tile = this.parent.getTile(Math.floor(rayX), Math.floor(rayY));

                if(tile == null) { continue; }

                tile.previousBrightness = tile.brightness;

                if(tile.type == MapTile.TYPES.EMPTY)
                {
                    tile.brightness = tile.brightness;
                    tile.isRevealed = this.isRevealed;
                    break;
                }

                tile.brightness = (distance > 3 || dim)? tile.proposedBrightness : 1.0;
                tile.isRevealed = (distance > 3 || dim)? tile.isRevealed : true;

                if(tile.type == MapTile.TYPES.WALL || (tile.type == MapTile.TYPES.DOOR && !tile.isActivated))
                {
                    dim = true;
                }

                // update the map render if the tile brightness has changed
                if(tile.previousBrightness != tile.brightness)
                {
                    this.renderTile(tile);
                }
            }
        }
    }

    drawMapTile(tile)
    {
        // // yield if empty or unexplored
        // if(tile === null || tile.type == MapTile.TYPES.EMPTY) { return; }

        // // get neighbors in connectable directions (N, E, S, W)
        // const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getKeyDirections());

        // for(const neighbor of neighbors)
        // {
        //     //this.drawMapTileShadow(neighbor);
        // }

        // const renderX = tile.renderX + this.drawOffsetX;
        // const renderY = tile.renderY + this.drawOffsetY;

        // if(tile.isTransparent)
        // {
        //     this.drawSprite(tile, MapTile.TYPES.FLOOR);
        // }

        // this.drawSprite(tile);

        // if(this.isLightingEnabled)
        // {
        //     let darkness = 1.0 - tile.brightness;

        //     const shadowColor = "rgba(16, 12, 7, " + darkness + ")";

        //     GAME.gfx.main.drawRectangle(renderX, renderY, this.outerDrawSize, this.outerDrawSize, shadowColor, darkness);
        // }
        

        // if(tile.type == MapTile.TYPES.DEBUG || tile.isCorner || tile.isNearDoor || tile.isNearColumn)
        // {
        //     this.drawDebugBox(tile);
        // }

        // return;
    }
}