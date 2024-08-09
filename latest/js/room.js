class Room
{
    static TYPES = {
        EMPTY: 0,
        REGULAR: 1,
        DEADEND: 2,
        SPAWN: 3
    }

    static generateEmptyRoom(x, y, type)
    {
        const data = Array(10).fill(0);
        const status = 0; // 0 = unexplored

        data[0] = status;
        data[1] = x;
        data[2] = y;
        data[3] = type;

        return new Room([status, x, y, type, 0, 0, 0, 0, 0, 0]);
    }

    constructor(data)
    {
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
        return Object.values(this);
    }

    isEmpty(x, y)
    {
        return (this.type == 0);
    }
}