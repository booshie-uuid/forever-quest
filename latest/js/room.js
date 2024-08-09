class Room
{
    static TYPES = {
        EMPTY: 0,
        REGULAR: 1,
        DEADEND: 2,
        SPAWN: 3
    }

    static generateEmptyRoom(map, x, y, type)
    {
        const data = Array(10).fill(0);
        const status = 0; // 0 = unexplored

        data[0] = status;
        data[1] = x;
        data[2] = y;
        data[3] = type;

        return new Room(map, [status, x, y, type, 0, 0, 0, 0, 0, 0]);
    }

    constructor(map, data)
    {
        this.map = map;

        this.status = data[0];
        this.x = data[1];
        this.y = data[2];
        this.type = data[3];
        this.variant = data[4];
        this.encounterKey = data[5];

        this.hasNorthDoor = data[6] == 1;
        this.hasEastDoor = data[7] == 1;
        this.hasSouthDoor = data[8] == 1;
        this.hasWestDoor = data[9] == 1;

        this.drawX = (this.x * 38) + 12;
        this.drawY = (this.y * 38) + 12;
    }

    compress()
    {
        // get all fields except map, drawX, and drawY
        const { map, drawX, drawY, ...rest } = this;
    
        return Object.values(rest);
    }

    isEmpty(x, y)
    {
        return (this.type == 0);
    }

    getNeighborByDirection(map, direction)
    {
        const deltas = DIRECTIONS.getDirectionDeltas(direction);

        if(deltas === null) { return null; }

        const row = this.x + deltas.x;
        const col = this.y + deltas.y;

        return this.map.getRoom(row, col);
    }
}