class DIRECTIONS
{
    static NORTH = "north";
    static EAST = "east";
    static SOUTH = "south";
    static WEST = "west";

    static NORTH_EAST = "north-east";
    static SOUTH_EAST = "south-east";
    static SOUTH_WEST = "south-west";
    static NORTH_WEST = "north-west";

    static getKeyDirections()
    {
        return [DIRECTIONS.NORTH, DIRECTIONS.EAST, DIRECTIONS.SOUTH, DIRECTIONS.WEST];
    }

    static getAllDirections()
    {
        return [DIRECTIONS.NORTH, DIRECTIONS.EAST, DIRECTIONS.SOUTH, DIRECTIONS.WEST, DIRECTIONS.NORTH_EAST, DIRECTIONS.SOUTH_EAST, DIRECTIONS.SOUTH_WEST, DIRECTIONS.NORTH_WEST];
    }

    static getRandomDirection(chance)
    {
        const directions = [DIRECTIONS.NORTH, DIRECTIONS.EAST, DIRECTIONS.SOUTH, DIRECTIONS.WEST];
        const direction = chance.pick(directions);

        return direction;
    }

    static getDirectionDeltas(direction)
    {
        switch (direction)
        {
            case DIRECTIONS.NORTH: return { x: 0, y: -1 };
            case DIRECTIONS.EAST: return { x: 1, y: 0 };
            case DIRECTIONS.SOUTH: return { x: 0, y: 1 };
            case DIRECTIONS.WEST: return { x: -1, y: 0 };
            case DIRECTIONS.NORTH_EAST: return { x: 1, y: -1 };
            case DIRECTIONS.SOUTH_EAST: return { x: 1, y: 1 };
            case DIRECTIONS.SOUTH_WEST: return { x: -1, y: 1 };
            case DIRECTIONS.NORTH_WEST: return { x: -1, y: -1 };
            default: return null;
        }
    }

    static getDirectionsDeltas(directions)
    {
        const deltas = [];

        for(const direction in directions)
        {
            const delta = DIRECTIONS.getDirectionDeltas(direction);

            if(delta != null) { deltas.push(delta); }
        }

        return deltas;
    }

}