class MapSector
{
    constructor(map, key, startCol, startRow, finishCol, finishRow, shouldDisableTransformations = false)
	{
        this.map = map;
        this.key = key;
        
        this.isReady = false;
        this.isTranformationDisabled = shouldDisableTransformations;
        
        this.config = new GameData(`sectors/${key}.json`, this.unpackConfig.bind(this));
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

    unpackConfig()
    {
        this.layout = this.config.data.layout;
        this.isReady = true;

        const transformation = (this.isTranformationDisabled)? 0 : GAME.chance.range(1, 5);

        switch(transformation)
        {
            case 1: this.rotateLayoutClockwise(); break;
            case 2: this.rotateLayoutCounterClockwise(); break;
            case 3: this.flipLayoutHorizontal(); break;
            case 4: this.flipLayoutVertical(); break;
            case 5: default: break;
        }
    }

    rotateLayoutClockwise()
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

    flipLayoutHorizontal()
    {
        const newLayout = this.layout.map((row) => row.toReversed());

        for(let row = 0; row < this.layout.length; row++)
        {
            for(let col = 0; col < this.layout[row].length; col++)
            {
                const code = newLayout[row][col];
                
                if(code == "@1") { newLayout[row][col] = "@N"; }
                if(code == "@2") { newLayout[row][col] = "@W"; }
                if(code == "@3") { newLayout[row][col] = "@S"; }
                if(code == "@4") { newLayout[row][col] = "@E"; }
            }
        }
    
        this.layout = newLayout;
        this.fixRotatedDoorCodes();
    }

    flipLayoutVertical()
    {
        const newLayout = this.layout.toReversed();

        for(let row = 0; row < this.layout.length; row++)
        {
            for(let col = 0; col < this.layout[row].length; col++)
            {
                const code = newLayout[row][col];
                
                if(code == "@1") { newLayout[row][col] = "@S"; }
                if(code == "@2") { newLayout[row][col] = "@E"; }
                if(code == "@3") { newLayout[row][col] = "@N"; }
                if(code == "@4") { newLayout[row][col] = "@W"; }
            }
        }
    
        this.layout = newLayout;
        this.fixRotatedDoorCodes();
    }

    rotateLayoutCounterClockwise()
    {
        const newLayout = this.layout[0].map((val, index) => this.layout.map(row => row[row.length-1-index]));

        for(let row = 0; row < this.layout.length; row++)
        {
            for(let col = 0; col < this.layout[row].length; col++)
            {
                const code = newLayout[row][col];
                
                if(code == "@2") { newLayout[row][col] = "@N"; }
                if(code == "@3") { newLayout[row][col] = "@E"; }
                if(code == "@4") { newLayout[row][col] = "@S"; }
                if(code == "@1") { newLayout[row][col] = "@W"; }
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

    getTypeFromSymbol(symbol)
    {
        let type = null;
        
        switch(symbol)
        {
            case ".": type = MapTile.TYPES.EMPTY; break;
            case "#": type = MapTile.TYPES.WALL; break;
            case "%": type = MapTile.TYPES.FLOOR; break;
            case "@": type = MapTile.TYPES.GEN_DOOR; break;
            case "~": type = MapTile.TYPES.WATER; break;
            case "A": 
            case "B":
            case "C":
            case "D":
            case "E":
            case "F": type = MapTile.TYPES.SPECIAL; break;
            default: type = MapTile.TYPES.EMPTY; break;
        }

        return type;
    }

    decodeTileCode(code)
    {
        const symbol = code.substring(0, 1);
        const modifier = code.substring(1);

        let type = this.getTypeFromSymbol(symbol);
        let variant = null;

        if(modifier == symbol)
        {
            variant = GAME.chance.range(0, 7);
        }
        else
        {
            variant = parseInt(modifier);
            variant = isNaN(variant)? 0: variant;
        }

        return { type: type, variant: variant, symbol: symbol };
    }

    getTilePositions(type)
    {
        return this.tilePositions[type.toString()];
    }

    constructRoom()
    {
		for(let row = 0; row < 16; row++)
		{
			for(let col = 0; col < 16; col++)
			{
                const tileCol = this.startCol + col;
                const tileRow = this.startRow + row;
                const tile = this.map.getTile(tileCol, tileRow);

                const tileCode = this.layout[row][col];
                const tileSettings = this.decodeTileCode(tileCode);

                tile.symbol = tileSettings.symbol;
                tile.variant = tileSettings.variant;
                tile.setType(tileSettings.type);              

                if(!Array.isArray(this.tilePositions[tile.type])) { this.tilePositions[tile.type] = []; }

                this.tilePositions[tile.type.toString()].push({ col: tile.col, row: tile.row });
			}
		}

        const doorTilePositions = this.getTilePositions(MapTile.TYPES.GEN_DOOR);

        for(const position of doorTilePositions)
        {
            const tile = this.map.getTile(position.col, position.row);

            if(tile.variant == 1) { this.doorPositions[DIRECTIONS.NORTH] = position; }
            if(tile.variant == 2) { this.doorPositions[DIRECTIONS.EAST] = position; }
            if(tile.variant == 3) { this.doorPositions[DIRECTIONS.SOUTH] = position; }
            if(tile.variant == 4) { this.doorPositions[DIRECTIONS.WEST] = position; }
        }
    }
}