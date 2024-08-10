class Room extends GameEntity
{
    static TYPES = {
        EMPTY: 0,
        REGULAR: 1,
        DEADEND: 2,
        SPAWN: 3
    }

    static generateEmptyRoom(map, col, row, type)
    {
        const data = Array(10).fill(0);
        const status = 0; // 0 = unexplored

        data[0] = status;
        data[1] = col;
        data[2] = row;
        data[3] = type;

        return new Room(map, [status, col, row, type, 0, 0, 0, 0, 0, 0]);
    }

    constructor(map, data)
    {
        super(GameEntity.DESIGNATIONS.ROOM, `Room ${data[1]}, ${data[2]}`);

        this.map = map;

        this.status = data[0];
        this.col = data[1];
        this.row = data[2];
        this.type = data[3];
        this.variant = data[4];
        this.encounterKey = data[5];

        this.hasNorthDoor = data[6] == 1;
        this.hasEastDoor = data[7] == 1;
        this.hasSouthDoor = data[8] == 1;
        this.hasWestDoor = data[9] == 1;

        this.drawX = (this.col * 38) + 12;
        this.drawY = (this.row * 38) + 12;
    }

    compress()
    {
        // get all data fields (excluding inherited and calculated fields)
        const { designation, name, map, drawX, drawY, ...rest } = this;
    
        return Object.values(rest);
    }

    isEmpty(x, y)
    {
        return (this.type == 0);
    }

    isConnected(direction)
    {
        const neighbor = this.getNeighborByDirection(direction);

        if(neighbor === null) { return false; }

        return neighbor.type != Room.TYPES.EMPTY;
    }

    getNeighborsByDirection(directions)
    {
        const neighbors = [];

        for(const direction of directions)
        {
            const neighbor = this.getNeighborByDirection(direction);

            if(neighbor !== null) { neighbors.push(neighbor); }
        }

        return neighbors;
    }

    getNeighborByDirection(direction)
    {
        const deltas = DIRECTIONS.getDirectionDeltas(direction);

        if(deltas === null) { return null; }

        const row = this.col + deltas.col;
        const col = this.row + deltas.row;

        return this.map.getRoom(row, col);
    }
}