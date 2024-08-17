////////////////////////////////////////////////////////////////////////////////

class MapSectorEditor
{
    static STATES = {
        INITIALIZING: 0,
        LOADING_MAP: 1,
        LOADING_SECTOR: 2,
        UNPACKING_SECTOR: 3,
        READY: 4
    };

    constructor(release, displayID, sectorKey)
    {
        this.sectorKey = sectorKey;

        // environment configuration
        this.release = release;
        this.releasePath = release + "/";

        GameData.setDataPath(this.releasePath + "data/");
        GameTexture.setTexturePath(this.releasePath + "textures/");

        // initialise shared controllers (singletons)
        // GEQ = new GameEventQueue();
        GAME.chance = new SharedChance(Math.random());

        // key state properties
        this.state = MapSectorEditor.STATES.INITIALIZING;

        // output controllers
        GAME.gfx.main = new GFX(displayID, 1280, 720, this.error.bind(this));
        GAME.gfx.buffer = new GFX("buffer", 2400, 2400, this.error.bind(this));

        // input controllers and properties
        this.mouse = new Mouse(this.error.bind(this));
        this.mouse.onMouseChange = this.handleMouseChange.bind(this);

        this.keyboard = new Keyboard(this.handleKeyboardInput.bind(this));

        this.mouseDown = false;

        this.mouseCol = null;
        this.mouseRow = null;

        // data components
        this.sectorSize = 15;

        this.map = null;
        this.sector = null;

        // gui components
        this.spritePicker = null;

        this.update();
    }

    update()
    {
        // report and yield if chat or graphics engine are faulted
        if(GAME.gfx.main.isFaulted)
        {
            this.error("Could not initialize the graphics controller.");
            return;
        }

        if(this.state === MapSectorEditor.STATES.READY)
        {
            this.map.update();
            this.draw();

            this.spritePicker.update();
        }
        else if(this.state === MapSectorEditor.STATES.INITIALIZING)
        {
            this.map = new Map(GAME.gfx.main, true);

            this.state = MapSectorEditor.STATES.LOADING_MAP;
        }
        else if(this.state === MapSectorEditor.STATES.LOADING_MAP)
        {
            this.map.update();

            if(this.map.state === Map.STATES.GENERATING_MAP)
            {
                const startCol = 0;
				const startRow = 0;
				const finishCol = startCol + (this.sectorSize - 1);
				const finishRow = startRow + (this.sectorSize - 1);

                this.sector = new MapSector(this.map, this.sectorKey, startCol, startRow, finishCol, finishRow, false);
                
                this.state = MapSectorEditor.STATES.LOADING_SECTOR;
            }
        }
        else if(this.state === MapSectorEditor.STATES.LOADING_SECTOR)
        {
            this.spritePicker = new SpritePickerGUI(this.map.biome, this.map.texture);

            if(this.sector.isReady)
            {
                this.state = MapSectorEditor.STATES.UNPACKING_SECTOR;
            }
        }
        else if(this.state === MapSectorEditor.STATES.UNPACKING_SECTOR)
        {
            this.map.initializeGrid();
            this.sector.constructRoom();

            this.map.getTilesByType(MapTile.TYPES.GEN_DOOR).forEach(tile => tile.setType(MapTile.TYPES.DOOR));
            this.map.getTilesByType(MapTile.TYPES.EMPTY).filter(tile => this.sector.isWithinSector(tile)).forEach(tile => tile.setType(MapTile.TYPES.DEBUG));

            this.map.renderer.isLightingEnabled = false;
            this.map.generator.handleDebug();

            // disable fog of war
            for(const row of this.map.grid)
            {
                for(const tile of row)
                {
                    tile.brightness = 1.0;
                    this.map.renderer.renderTile(tile);
                }
            }

            // set the map state to ready
            this.map.state = Map.STATES.MAP_READY;
            
            this.map.currentCol = 8;
            this.map.currentRow = 8;
            this.map.renderer.calcDrawOffsetX(8, 8, true);

            this.state = MapSectorEditor.STATES.READY;
        }
        
        window.requestAnimationFrame(this.update.bind(this));
    }

    handleKeyboardInput(key, isKeyDown)
    {
        let wasIntercepted = false;

        return wasIntercepted;
    }

    handleMouseChange()
    {
        if(this.state !== MapSectorEditor.STATES.READY) { return; }

        // temporarily store the current and previous mouse down states
        const previousMouseDown = this.mouseDown;
        const currentMouseDown = this.mouse.isDown;

        // update the mouse down state that is tracked across updates
        // we do this first to prevent any strange behaviour if any of the following code throws an error
        this.mouseDown = this.mouse.isDown;

        const pos = this.map.renderer.getPosFromScreen(this.mouse.x, this.mouse.y);

        if(this.sector.isPosWithinSector(pos.col, pos.row))
        {
            this.mouseCol = pos.col;
            this.mouseRow = pos.row;
        }
        else
        {
            this.mouseCol = null;
            this.mouseRow = null;
        }

        if(previousMouseDown && !currentMouseDown)
        {
            this.spritePicker.handleClick(this.mouse.x, this.mouse.y);

            if(this.sector.isPosWithinSector(pos.col, pos.row))
            { 
                const tile = this.map.getTile(pos.col, pos.row);

                this.updateTile(tile, this.mouse.button === 2);
            }
        }
    }

    updateDoor(tile)
    {
        const symbol = this.spritePicker.selectedSymbol;

        if(symbol !== "@") { return; }

        const doorDirection = this.calculateDoorPosition(tile);

        if(doorDirection === DIRECTIONS.NONE)
        {
            this.error("Cannot place a door here.");
            return;
        }

        let variant = 0;

        switch(doorDirection)
        {
            case DIRECTIONS.NORTH: variant = 1; break;
            case DIRECTIONS.EAST: variant = 2; break;
            case DIRECTIONS.SOUTH: variant = 3; break;
            case DIRECTIONS.WEST: variant = 4; break;
            default: variant = 0; break;
        }

        tile.type = MapTile.TYPES.DOOR;
        tile.isActivated = false;
        tile.variant = variant;

        tile.spritePositions.baseCol = variant;
        tile.spritePositions.baseRow = MapTile.TYPES.DOOR;
    }

    updateOverlay(tile)
    {
        const symbol = this.spritePicker.selectedSymbol;

        if(!["A", "B", "C", "D", "E", "F"].includes(symbol)) { return; }

        tile.spritePositions.overlayCol = this.spritePicker.currentVariant;
        tile.spritePositions.overlayRow = parseInt(symbol, 16);
    }

    updateBase(tile)
    {
        const symbol = this.spritePicker.selectedSymbol;

        if(!["#", "%", "~"].includes(symbol)) { return; }

        let type = this.sector.getTypeFromSymbol(symbol);
        let variant = this.spritePicker.currentVariant;

        // override the type & variant if the tile is being removed
        tile.variant = variant;
        tile.symbol = symbol;
        
        tile.spritePositions.baseCol = variant;
        tile.spritePositions.baseRow = type;

        tile.setType(type);
    }

    getCode(tile)
    {
        const baseCol = tile.spritePositions.baseCol.toString(16);
        const baseRow = this.sector.getSymbolFromType(tile.type);
        const overlayCol = (tile.spritePositions.overlayCol === null)? "" : tile.spritePositions.overlayCol.toString(16);
        const overlayRow = (tile.spritePositions.overlayRow === null)? "" : tile.spritePositions.overlayRow.toString(16);

        const code = baseRow + baseCol + overlayRow + overlayCol;

        return code;
    }

    updateTile(tile, isRemoveMode = false)
    {
        if(tile === null) { return; }

        const sectorCol = Math.floor(tile.col - this.sector.startCol);
        const sectorRow = Math.floor(tile.row - this.sector.startRow);

        console.log(`MAP COL: ${tile.col}, MAP ROW: ${tile.row}, TILE: ${tile.type}, VARIANT: ${tile.variant}`);
        console.log(`SEC COL: ${sectorCol}, SEC ROW: ${sectorRow}`);

        if(isRemoveMode)
        {
            tile.variant = 0;
            tile.spritePositions.baseCol = 0;
            tile.spritePositions.baseRow = 0;
            tile.spritePositions.overlayCol = null;
            tile.spritePositions.overlayRow = null;

            tile.setType(MapTile.TYPES.DEBUG);
        }
        else
        {
            this.updateBase(tile);
            this.updateOverlay(tile);
            this.updateDoor(tile);
        }
        
        // force neighbors to recalculate their horizontal state
        const neighbors = tile.getNeighborsByDirection(DIRECTIONS.getAllDirections());
        neighbors.forEach(neighbor => neighbor.clearCheckResults());

        // update the map render
        this.map.renderer.renderTile(tile);

        // update the sector layout
        const code = (isRemoveMode)? ".." : this.getCode(tile);

        this.sector.layout[sectorRow][sectorCol] = code;
    }

    calculateDoorPosition(tile)
    {
        const doors = this.map.getTilesByType(MapTile.TYPES.DOOR).filter(candidate => this.sector.isWithinSector(candidate) && !(candidate.col === tile.col && candidate.row === tile.row));

        let doorDirection = null;

        if (doors.length > 0)
        {
            const furthestSouth = Math.max(...doors.map(door => door.row));
            const furthestNorth = Math.min(...doors.map(door => door.row));
            const furthestEast = Math.max(...doors.map(door => door.col));
            const furthestWest = Math.min(...doors.map(door => door.col));

            if(tile.row > furthestSouth) { doorDirection = DIRECTIONS.SOUTH; }
            else if(tile.row < furthestNorth) { doorDirection = DIRECTIONS.NORTH; }
            else if(tile.col > furthestEast) { doorDirection = DIRECTIONS.EAST; }
            else if(tile.col < furthestWest) { doorDirection = DIRECTIONS.WEST; }
            else { doorDirection = DIRECTIONS.NONE; }
        }

        return doorDirection;
    }

    draw()
    {
        // yield if the player is not assigned to a map
        if(this.map === null) { return; }

        this.drawHighlights();
    }

    drawHighlights()
    {
        this.highlightHiddenVariants();
        this.highlightDoorDirections();

        if(this.mouseCol === null || this.mouseRow === null) { return; }

        // highlight current location
        const tile = this.map.getTile(this.mouseCol, this.mouseRow);

        // yield if the mouse is not over a valid tile
        if(tile === null) { return; }

        const screenPos = this.map.renderer.getScreenPos(tile);
        const drawX = screenPos.x;
        const drawY = screenPos.y;
        const drawSize = this.map.renderer.outerDrawSize;

        GAME.gfx.main.drawRectangleOutline(drawX, drawY, drawSize, drawSize, "#ef7d57", 2);
    }

    highlightHiddenVariants()
    {
        const sensitiveTypes = [MapTile.TYPES.WALL];

        for(const row of this.map.grid)
        {
            for(const tile of row.filter(candidate => this.sector.isWithinSector(candidate) && sensitiveTypes.includes(candidate.type)))
            {
                if(tile.variant === tile.getRenderVariant()) { continue; }

                const screenPos = this.map.renderer.getScreenPos(tile);
                const drawX = screenPos.x;
                const drawY = screenPos.y;
                const drawSize = this.map.renderer.outerDrawSize;

                GAME.gfx.main.drawRectangleOutline(drawX, drawY, drawSize, drawSize, "#b13e53", 2, [1, 3]);
            }
        }
    }

    highlightDoorDirections()
    {
        const doors = this.map.getTilesByType(MapTile.TYPES.DOOR).filter(tile => this.sector.isWithinSector(tile));

        for(const door of doors)
        {
            const screenPos = this.map.renderer.getScreenPos(door);
            const drawX = screenPos.x + 10;
            const drawY = screenPos.y + 10;

            let label = "?";

            switch(door.variant)
            {
                case 1: label = "N"; break;
                case 2: label = "E"; break;
                case 3: label = "S"; break;
                case 4: label = "W"; break;
            }

            GAME.gfx.main.write(label.substring(0,1), drawX, drawY, 16, "#73eff7", true);
        }
    }

    error(message)
    {
        console.log(message);
    }
}