class MapRenderer
{
    constructor(map)
    {
        this.map = map;
        this.gfx = map.gfx;
        this.texture = map.texture;
        this.theme = map.biome.theme;

        this.screenWidth = this.gfx.canvas.width;
        this.screenHeight = this.gfx.canvas.height;

        this.drawOffsetX = 12;
        this.drawOffsetY = 12;
        this.outerDrawSize = 32;
        this.innerDrawSize = 32;

        this.targetDrawOffsetX = this.drawOffsetX;
        this.targetDrawOffsetY = this.drawOffsetY;
    }

    calcDrawOffsetX(playerCol, playerRow, snap = false)
    {
        this.targetDrawOffsetX = -(playerCol * this.outerDrawSize) + Math.floor(this.screenWidth / 2);
        this.targetDrawOffsetY = -(playerRow * this.outerDrawSize) + Math.floor(this.screenHeight / 2);

        if(snap)
        {
            this.drawOffsetX = this.targetDrawOffsetX;
            this.drawOffsetY = this.targetDrawOffsetY;
        }
    }

    getTileFromScreen(x, y)
    {
        const col = Math.floor((x - this.drawOffsetX) / this.outerDrawSize);
        const row = Math.floor((y - this.drawOffsetY) / this.outerDrawSize);

        return this.map.getTile(col, row);
    }

    getDebugColor(tile)
    {
        let color = "magenta";

        switch(tile.type)
        {
            case MapTile.TYPES.GEN_PATHWAY: color = "GREEN"; break;
            case MapTile.TYPES.GEN_EXPANSION: color = "BLUE"; break;
            case MapTile.TYPES.GEN_WALL: color = "RED"; break;
            case MapTile.TYPES.WALL: color = "#3e4a6d"; break;
            case MapTile.TYPES.FLOOR: color = "#96a3b0"; break;
            case MapTile.TYPES.DOOR: color = "#5a7088"; break;
            case MapTile.TYPES.COLUMN: color = "#3e4a6d"; break;
            case MapTile.TYPES.EMPTY: color = "black"; break;
            case MapTile.TYPES.REGULAR: color = "#bdbdbd"; break;
            case MapTile.TYPES.DEADEND: color = "#ff4081"; break;
            case MapTile.TYPES.SPAWN: color = "pink"; break;
            case MapTile.TYPES.EXIT: color = "red"; break;
            case MapTile.TYPES.ENCOUNTER: color = "orange"; break;
            case MapTile.TYPES.DISCOVERABLE: color = "yellow"; break;
            case MapTile.TYPES.JUNCTION: color = "#3f51b5"; break;
            case MapTile.TYPES.POTENTIAL_JUNCTION: color = "#9c27b0"; break;
        }

        return color;
    }

    draw()
    {
        if(this.targetDrawOffsetX != this.drawOffsetX)
        {
            this.drawOffsetX = Number.converge(this.drawOffsetX, this.targetDrawOffsetX);
        }

        if(this.targetDrawOffsetY != this.drawOffsetY)
        {
            this.drawOffsetY = Number.converge(this.drawOffsetY, this.targetDrawOffsetY);
        }

        //this.gfx.fillBackground(this.theme.backgroundColor);
        this.gfx.fillBackground("#100c07");

        for(let row = 0; row < this.map.gridRows; row++)
        {    
            for(let col = 0; col < this.map.gridCols; col++)
            {
                const tile = this.map.getTile(col, row);
                this.drawMapTile(tile);
            }
        }
        
        this.drawDebugHighlights();
    }

    drawMapTile(tile)
    {
        // yield if empty or unexplored
        if(tile === null || tile.type == MapTile.TYPES.EMPTY) { return; }

        // get neighbors in connectable directions (N, E, S, W)
        const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getKeyDirections());

        for(const neighbor of neighbors)
        {
            //this.drawMapTileShadow(neighbor);
        }

        const drawX = tile.drawX + this.drawOffsetX;
        const drawY = tile.drawY + this.drawOffsetY;

        this.gfx.drawRectangle(drawX, drawY, this.outerDrawSize, this.outerDrawSize, this.getDebugColor(tile));

        if(tile.type == MapTile.TYPES.WALL)
        {
            const spriteY = 34;
            const spriteX = 34 + (tile.variant * 33);
            this.gfx.drawSprite(this.texture, spriteX, spriteY, drawX, drawY, this.outerDrawSize, this.outerDrawSize);  
        }
        else if(tile.type == MapTile.TYPES.FLOOR || tile.type == MapTile.TYPES.DOOR)
        {
            const spriteY = 67;
            const spriteX = 34 + (tile.variant * 33);
            this.gfx.drawSprite(this.texture, spriteX, spriteY, drawX, drawY, this.outerDrawSize, this.outerDrawSize);  
        }

        if(tile.type == MapTile.TYPES.DOOR)
        {
            const spriteY = 133;
            const spriteX = (tile.isOpen)? 67: 34;
            this.gfx.drawSprite(this.texture, spriteX, spriteY, drawX, drawY, this.outerDrawSize, this.outerDrawSize);  
        }

        const radius = 4.0;
        const distance = Math.hypot(tile.row - this.map.currentRow, tile.col - this.map.currentCol);
        const maxDistance = Math.hypot(radius, radius);
        const relative = distance / maxDistance;
        const minBrightness = 0.1;
        const maxBrightness = 1.0;

        const brightness = maxBrightness - relative * (maxBrightness - minBrightness);
        let darkness = 1.0 - brightness;

        // darkness = (tile.status == 3 && darkness > 0.87)? 0.87: darkness;

        // if(darkness <= 0.87)
        // {
        //     tile.status = 3;
        //     this.map.updateMapTile(tile);
        // }

        const shadowColor = "rgba(16, 12, 7, " + darkness + ")";

        this.gfx.drawRectangle(drawX, drawY, this.outerDrawSize, this.outerDrawSize, shadowColor, darkness);
        

        if(tile.isCorner || tile.isNearDoor || tile.isNearColumn)
        {
            this.gfx.drawRectangleOutline(drawX, drawY, this.outerDrawSize, this.outerDrawSize, "red", 1, [1, 2]);
        }

        return;
        let types = [];

        if(tile.type == MapTile.TYPES.REGULAR)
        {    
            types = this.map.biome.commonMapTiles;
        }
        else
        {
            types = this.map.biome.rareMapTiles;
        }

        const tileData = types[tile.variant];

        // yeild if no data can be found about the tile type
        if(tileData === null) { return; }

        this.gfx.drawSprite(this.texture, tileData.spriteX, tileData.spriteY, drawX + 1, drawY + 1, this.innerDrawSize, this.innerDrawSize);

        this.drawEncounter(tile);
        this.drawDiscoverable(tile);
    }

    drawMapTileShadow(tile)
    {
        // yield if the tile is empty or has already been explored
        if(tile === null || tile.type == MapTile.TYPES.EMPTY || tile.status > 1) { return; }

        const drawX = tile.drawX + this.drawOffsetX;
        const drawY = tile.drawY + this.drawOffsetY;

        this.gfx.drawRectangle(drawX + 1, drawY + 1, this.innerDrawSize, this.innerDrawSize, this.theme.tileShadowColor);
    }

    drawEncounter(tile)
    {
        // yeild if the tile does not contain an encounter
        if(!Encounter.containsEncounter(tile)) { return; }

        const encounter = Encounter.fromMapTile(this.map.biome, tile);

        // yield if a valid encounter can not be found
        if(encounter === null) { return; }

        const spriteX = encounter.spriteX;
        const spriteY = encounter.spriteY;
        const spriteOffsetX = (typeof encounter.spriteOffsetX !== "undefined" && encounter.spriteOffsetX != null)? encounter.spriteOffsetX: 0;
        const spriteOffsetY = (typeof encounter.spriteOffsetY !== "undefined" && encounter.spriteOffsetY != null)? encounter.spriteOffsetY: 0;

        const drawX = tile.drawX + this.drawOffsetX + 3 + spriteOffsetX;
        const drawY = tile.drawY + this.drawOffsetY - 8 + spriteOffsetY;

        this.gfx.drawSprite(this.texture, spriteX, spriteY, drawX, drawY);
    }

    drawDiscoverable(tile)
    {
        // yeild if the tile does not contain an encounter
        if(!Discoverable.containsDiscoverable(tile)) { return; }
        
        const discoverable = Discoverable.fromMapTile(this.map.biome, tile);

        // yeild if the discoverable could not be found
        if(discoverable == null) { return; }

        const spriteX = discoverable.spriteX;
        const spriteY = discoverable.spriteY;

        const drawX = tile.drawX + this.drawOffsetX + 1;
        const drawY = tile.drawY + this.drawOffsetY + 1;

        this.gfx.drawSprite(this.texture, spriteX, spriteY, drawX, drawY, this.innerDrawSize, this.innerDrawSize);
    }

    drawDebugHighlights()
    {
        if(!ENV.DEBUG) { return; }

        for(let row = 0; row < this.map.gridRows; row++)
        {    
            for(let col = 0; col < this.map.gridCols; col++)
            {
                const tile = this.map.getTile(col, row);

                const drawX = tile.drawX + this.drawOffsetX;
                const drawY = tile.drawY + this.drawOffsetY;

                if(ENV.DEBUG_FLAGS.indexOf("highlightEncounters") >= 0 && Encounter.containsEncounter(tile))
                {
                    this.gfx.drawRectangleOutline(drawX, drawY, this.outerDrawSize, this.outerDrawSize, "red", 2);
                }

                if(ENV.DEBUG_FLAGS.indexOf("highlightDiscoverables") >= 0 && Discoverable.containsDiscoverable(tile))
                {
                    this.gfx.drawRectangleOutline(drawX, drawY, this.outerDrawSize, this.outerDrawSize, "blue", 2);
                }
            }
        }
    }
}