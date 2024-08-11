class MapRenderer
{
    constructor(map)
    {
        this.map = map;
        this.gfx = map.gfx;
        this.texture = map.texture;
        this.theme = map.biome.theme;

        this.drawOffsetX = 12;
        this.drawOffsetY = 12;
        this.outerDrawSize = 38;
        this.innerDrawSize = 36;
    }

    getRoomFromScreen(x, y)
    {
        const col = Math.floor((x - this.drawOffsetX) / this.outerDrawSize);
        const row = Math.floor((y - this.drawOffsetY) / this.outerDrawSize);

        return this.map.getRoom(col, row);
    }

    draw()
    {
        this.gfx.fillBackground(this.theme.backgroundColor);

        for(let row = 0; row < this.map.gridRows; row++)
        {    
            for(let col = 0; col < this.map.gridCols; col++)
            {
                const room = this.map.getRoom(col, row);
                this.drawRoom(room);
            }
        }
        
        this.drawDebugHighlights();
    }

    drawRoom(room)
    {
        // yield if empty or unexplored
        if(room === null || room.type == Room.TYPES.EMPTY || room.status < 2) { return; }

        // get neighbors in connectable directions (N, E, S, W)
        const neighbors = room.getNeighborsByDirection(DIRECTIONS.getKeyDirections());

        for(const neighbor of neighbors)
        {
            this.drawRoomShadow(neighbor);
        }

        const drawX = room.drawX + this.drawOffsetX;
        const drawY = room.drawY + this.drawOffsetY;

        this.gfx.drawRectangle(drawX, drawY, this.outerDrawSize, this.outerDrawSize, this.theme.backgroundColor);

        let types = [];

        if(room.type == Room.TYPES.REGULAR)
        {    
            types = this.map.biome.commonRooms;
        }
        else
        {
            types = this.map.biome.rareRooms;
        }

        const roomData = types[room.variant];

        // yeild if no data can be found about the room type
        if(roomData === null) { return; }

        this.gfx.drawSprite(this.texture, roomData.spriteX, roomData.spriteY, drawX + 1, drawY + 1, this.innerDrawSize, this.innerDrawSize);

        this.drawEncounter(room);
        this.drawDiscoverable(room);
    }

    drawRoomShadow(room)
    {
        // yield if the room is empty or has already been explored
        if(room === null || room.type == Room.TYPES.EMPTY || room.status > 1) { return; }

        const drawX = room.drawX + this.drawOffsetX;
        const drawY = room.drawY + this.drawOffsetY;

        this.gfx.drawRectangle(drawX + 1, drawY + 1, this.innerDrawSize, this.innerDrawSize, this.theme.roomShadowColor);
    }

    drawEncounter(room)
    {
        // yeild if the room does not contain an encounter
        if(!Encounter.containsEncounter(room)) { return; }

        const encounter = Encounter.fromRoom(this.map.biome, room);

        // yield if a valid encounter can not be found
        if(encounter === null) { return; }

        const spriteX = encounter.spriteX;
        const spriteY = encounter.spriteY;
        const spriteOffsetX = (typeof encounter.spriteOffsetX !== "undefined" && encounter.spriteOffsetX != null)? encounter.spriteOffsetX: 0;
        const spriteOffsetY = (typeof encounter.spriteOffsetY !== "undefined" && encounter.spriteOffsetY != null)? encounter.spriteOffsetY: 0;

        const drawX = room.drawX + this.drawOffsetX + 3 + spriteOffsetX;
        const drawY = room.drawY + this.drawOffsetY - 8 + spriteOffsetY;

        this.gfx.drawSprite(this.texture, spriteX, spriteY, drawX, drawY);
    }

    drawDiscoverable(room)
    {
        // yeild if the room does not contain an encounter
        if(!Discoverable.containsDiscoverable(room)) { return; }
        
        const discoverable = Discoverable.fromRoom(this.map.biome, room);

        // yeild if the discoverable could not be found
        if(discoverable == null) { return; }

        const spriteX = discoverable.spriteX;
        const spriteY = discoverable.spriteY;

        const drawX = room.drawX + this.drawOffsetX + 1;
        const drawY = room.drawY + this.drawOffsetY + 1;

        this.gfx.drawSprite(this.texture, spriteX, spriteY, drawX, drawY, this.innerDrawSize, this.innerDrawSize);
    }

    drawDebugHighlights()
    {
        if(!ENV.DEBUG) { return; }

        for(let row = 0; row < this.map.gridRows; row++)
        {    
            for(let col = 0; col < this.map.gridCols; col++)
            {
                const room = this.map.getRoom(col, row);

                const drawX = room.drawX + this.drawOffsetX;
                const drawY = room.drawY + this.drawOffsetY;

                if(ENV.DEBUG_FLAGS.indexOf("highlightEncounters") >= 0 && Encounter.containsEncounter(room))
                {
                    this.gfx.drawRectangleOutline(drawX, drawY, this.outerDrawSize, this.outerDrawSize, "red", 2);
                }

                if(ENV.DEBUG_FLAGS.indexOf("highlightDiscoverables") >= 0 && Discoverable.containsDiscoverable(room))
                {
                    this.gfx.drawRectangleOutline(drawX, drawY, this.outerDrawSize, this.outerDrawSize, "blue", 2);
                }
            }
        }
    }
}