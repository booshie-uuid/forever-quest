class MapSector
{
    static SECTOR_SIZE = 15;

    constructor(map, config, startCol, startRow, finishCol, finishRow)
	{
        this.map = map;

        this.config = config;
        this.key = config.key;
        
        this.isReady = false;

        this.canRotate = (typeof config.disableRotation === "undefined" || config.disableRotation === null)? true : !config.disableRotation;
        this.canHideOverlays = true;
        
        this.layoutDoc = new GameData(`sectors/${this.key}.json`, this.unpackLayout.bind(this));
        this.layout = null; 

		this.startCol = startCol;
		this.startRow = startRow;
		this.finishX = finishCol;
		this.finishY = finishRow;

		// to add variety to the level layout, each sector will have a random buffer around the edges
		const northBias = (GAME.chance.range(0, 1) == 0);
		const eastBias = (GAME.chance.range(0, 1) == 0);

		this.northBuffer = (northBias)? GAME.chance.range(1, 4): GAME.chance.range(1, 8);
		this.southBuffer = (!northBias)? GAME.chance.range(2, 4): GAME.chance.range(2, 6);	
		this.eastBuffer = (eastBias)? GAME.chance.range(2, 4): GAME.chance.range(2, 8);
		this.westBuffer = (!eastBias)? GAME.chance.range(1, 4): GAME.chance.range(1, 6);

        this.roomStartCol = startCol + this.westBuffer;
        this.roomStartRow = startRow + this.northBuffer;
        this.roomFinishCol = finishCol - this.eastBuffer;
        this.roomFinishRow = finishRow - this.southBuffer;

        this.roomWidth = this.roomFinishCol - this.roomStartCol;
        this.roomHeight = this.roomFinishRow - this.roomStartRow;

        this.tilePositions = [];
        this.floorTiles = [];
        this.wallTiles = [];

		// each sector will also have four tiles that are designated as potential doors
		// the designation of doors will happen during the room generation phase
        this.doorPositions = [];

		this.doorPositions[DIRECTIONS.NORTH] = null;
		this.doorPositions[DIRECTIONS.EAST] = null;
		this.doorPositions[DIRECTIONS.SOUTH] = null;
		this.doorPositions[DIRECTIONS.WEST] = null;

		// each sector will have a single encounter that will be placed within the sector
		this.encounterCol = GAME.chance.range(startCol + this.westBuffer + 1, finishCol - this.eastBuffer - 1);
		this.encounterRow = GAME.chance.range(startRow + this.northBuffer + 1, finishRow - this.southBuffer - 1);
	}

    isWithinSector(tile)
    {
        return (tile.col >= this.startCol && tile.col <= this.finishX && tile.row >= this.startRow && tile.row <= this.finishY);
    }
    
    isPosWithinSector(col, row)
    {
        return (col >= this.startCol && col <= this.finishX && row >= this.startRow && row <= this.finishY);
    }

    unpackLayout()
    {
        this.layout = this.layoutDoc.data.layout;
        this.isReady = true;

        const rotations = (this.canRotate)? GAME.chance.range(0, 3) : 0;

        for(let i = 0; i < rotations; i++)
        { 
            this.rotateLayout();
        }
    }

    rotateLayout()
    {
        const newLayout = this.layout[0].map((val, index) => this.layout.map(row => row[index]).reverse());

        for(let row = 0; row < this.layout.length; row++)
        {
            for(let col = 0; col < this.layout[row].length; col++)
            {
                const code = newLayout[row][col];
                
                if(code == "@4") { newLayout[row][col] = "@N"; }
                if(code == "@1") { newLayout[row][col] = "@E"; }
                if(code == "@2") { newLayout[row][col] = "@S"; }
                if(code == "@3") { newLayout[row][col] = "@W"; }
            }
        }

        this.layout = newLayout;
        this.fixRotatedDoorCodes();
    }

    fixRotatedDoorCodes()
    {
        for(let row = 0; row < this.layout.length; row++)
        {
            for(let col = 0; col < this.layout[row].length; col++)
            {
                const code = this.layout[row][col];
                
                if(code == "@N") { this.layout[row][col] = "@1"; }
                if(code == "@E") { this.layout[row][col] = "@2"; }
                if(code == "@S") { this.layout[row][col] = "@3"; }
                if(code == "@W") { this.layout[row][col] = "@4"; }
            }
        }
    }

    getSymbolFromType(type)
    {
        let symbol = null;
        
        switch(type)
        {
            case MapTile.TYPES.GEN_WALL: symbol = "#"; break;
            case MapTile.TYPES.GEN_PATHWAY: symbol = "*"; break;
            case MapTile.TYPES.GEN_EXPANSION: symbol = "+"; break;
            case MapTile.TYPES.GEN_DOOR: symbol = "@"; break;
            default: symbol = type; break;
        }

        return symbol;
    }

    getTypeFromSymbol(symbol)
    {
        let type = null;
        
        switch(symbol)
        {
            case "#": type = MapTile.TYPES.GEN_WALL; break;
            case "*": type = MapTile.TYPES.GEN_PATHWAY; break;
            case "+": type = MapTile.TYPES.GEN_EXPANSION; break;
            case "@": type = MapTile.TYPES.GEN_DOOR; break;
            default: type = parseInt(symbol, 16); break;
        }

        return (isNaN(type))? MapTile.TYPES.EMPTY : type;
    }

    decodeTileCode(code)
    {
        let baseRow = this.getTypeFromSymbol(code.substring(0, 1));
        let baseCol = parseInt(code.substring(1, 2), 16);
        let overlayRow = (code.length > 2)? parseInt(code.substring(2, 3), 16) : null;
        let overlayCol = (code.length > 3)? parseInt(code.substring(3, 4), 16) : null;

        baseCol = (isNaN(baseCol))? 0 : baseCol;
        baseRow = (isNaN(baseRow))? MapTile.TYPES.EMPTY : baseRow;
        
        overlayCol = (isNaN(overlayCol))? null : overlayCol;
        overlayRow = (isNaN(overlayRow))? null : overlayRow;

        return { baseCol, baseRow, overlayCol, overlayRow };
    }

    getTilePositions(type)
    {
        return this.tilePositions[type.toString()];
    }

    constructRoom()
    {
		for(let row = 0; row < MapSector.SECTOR_SIZE; row++)
		{
			for(let col = 0; col < MapSector.SECTOR_SIZE; col++)
			{
                const tileCol = this.startCol + col;
                const tileRow = this.startRow + row;
                const tile = this.map.getTile(tileCol, tileRow);

                const tileCode = this.layout[row][col];
                const tileSettings = this.decodeTileCode(tileCode);
                
                tile.spritePositions.baseCol = tileSettings.baseCol;
                tile.spritePositions.baseRow = tileSettings.baseRow;
                tile.spritePositions.overlayCol = tileSettings.overlayCol;
                tile.spritePositions.overlayRow = tileSettings.overlayRow;

                tile.setType(tileSettings.baseRow);           

                if(!Array.isArray(this.tilePositions[tile.type])) { this.tilePositions[tile.type] = []; }

                this.tilePositions[tile.type.toString()].push({ col: tile.col, row: tile.row });
			}
		}

        const doorTilePositions = this.getTilePositions(MapTile.TYPES.GEN_DOOR);

        for(const position of doorTilePositions)
        {
            const tile = this.map.getTile(position.col, position.row);

            if(tile.spritePositions.baseCol == 1) { this.doorPositions[DIRECTIONS.NORTH] = position; }
            if(tile.spritePositions.baseCol == 2) { this.doorPositions[DIRECTIONS.EAST] = position; }
            if(tile.spritePositions.baseCol == 3) { this.doorPositions[DIRECTIONS.SOUTH] = position; }
            if(tile.spritePositions.baseCol == 4) { this.doorPositions[DIRECTIONS.WEST] = position; }
        }
    }
}