class Feature
{
    static TYPES = {
        EXIT: 200,
        TREASURE_COMMON: 201,
        TREASURE_UNCOMMON: 202,
        TREASURE_RARE: 203,
        TREASURE_EPIC: 204,
        TREASURE_LEGENDARY: 205
    }

    static containsFeature(room)
    {
        return Object.values(Feature.TYPES).includes(room.type);
    }
}