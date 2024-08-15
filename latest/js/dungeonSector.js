class DungeonSector
{
    constructor(map, key, startCol, startRow, finishCol, finishRow)
	{
        this.map = map;
        this.key = key;
        
        this.isReady = false;
        
        this.config = new GameData(`sectors/${key}.json`, this.unpackConfig.bind(this));
        this.layout = null; 

		this.startCol = startCol;
		this.startRow = startRow;
		this.finishX = finishCol;
		this.finishY = finishRow;

		// to add variety to the level layout, each sector will have a random buffer around the edges
		const northBias = (SharedChance.range(0, 1) == 0);
		const eastBias = (SharedChance.range(0, 1) == 0);

		this.northBuffer = (northBias)? SharedChance.range(1, 4): SharedChance.range(1, 8);
		this.southBuffer = (!northBias)? SharedChance.range(2, 4): SharedChance.range(2, 6);	
		this.eastBuffer = (eastBias)? SharedChance.range(2, 4): SharedChance.range(2, 8);
		this.westBuffer = (!eastBias)? SharedChance.range(1, 4): SharedChance.range(1, 6);

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
		this.encounterCol = SharedChance.range(startCol + this.westBuffer + 1, finishCol - this.eastBuffer - 1);
		this.encounterRow = SharedChance.range(startRow + this.northBuffer + 1, finishRow - this.southBuffer - 1);
	}

    unpackConfig()
    {
        this.layout = this.config.data.layout;
        this.isReady = true;

        const transformation = SharedChance.range(1, 5);

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

    decodeTileCode(code)
    {
        const typeCode = code.substring(0, 1);
        const variantCode = code.substring(1, 2);

        let type = null;
        let variant = null;

        switch(typeCode)
        {
            case ".": type = MapTile.TYPES.EMPTY; break;
            case "#": type = MapTile.TYPES.WALL; break;
            case "%": type = MapTile.TYPES.FLOOR; break;
            case "@": type = MapTile.TYPES.GEN_DOOR; break;
        }

        if(variantCode == typeCode)
        {
            variant = SharedChance.range(0, 7);
        }
        else
        {
            variant = parseInt(variantCode);
            variant = isNaN(variant)? 0: variant;
        }

        return { type: type, variant: variant };
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

                tile.type = tileSettings.type;
                tile.variant = tileSettings.variant;
                this.map.updateMapTile(tile);

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