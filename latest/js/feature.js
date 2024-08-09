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

    static fromRoom(biome, room)
    {
        // yeild if the room does not have an encounter
        if(!Feature.containsFeature(room)) { return null; }

        return new Feature(biome, room.type);
    }

    constructor(biome, type)
    {
        this.biome = biome;
        this.type = type;

        const feature = this.biome.features.find(feature => feature.key == this.type);

        this.isFaulted = (typeof feature === "undefined" || feature === null);

        if(this.isFaulted) { return; }

        this.name = feature.name;
        this.isExit = feature.isExit;
        this.isLootable = feature.isLootable;
        this.spriteX = feature.spriteX;
        this.spriteY = feature.spriteY;
        this.loot = Array.isArray(feature.loot)? feature.loot : [];
    }

    getChatName()
    {       
        let tag = "COMMON";

        switch(this.type)
        {
            case Feature.TYPES.TREASURE_UNCOMMON: return "UNCOMMON";
            case Feature.TYPES.TREASURE_RARE: tag = "RARE"; break;
            case Feature.TYPES.TREASURE_EPIC: tag = "EPIC"; break;
            case Feature.TYPES.TREASURE_LEGENDARY: tag = "LEGENDARY"; break;
            default: tag = "COMMON"; break;
        }

        return `[${tag}][${this.name}][/${tag}]`;
    }
}