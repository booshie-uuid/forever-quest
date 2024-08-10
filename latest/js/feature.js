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
        this.revealNarration = (Array.isArray(feature.revealNarration))? feature.revealNarration: [];
    }

    getDisplayName()
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

    triggerRevealNarration()
    {
        let narration = (this.revealNarration.length > 0)? SharedChance.pick(this.revealNarration).text: "You have discovered @NAME!";

        let article = Grammar.getIndefiniteArticle(this.name);
        let prefix = (article)? `${article} ` : "";

        narration = narration.replace("@NAME", `${prefix}${this.getDisplayName()}`);

        // prepare a message for the player revealing the discovery
        const revealMessage = new ChatMessage(ChatMessage.TYPES.SHOUT, GameEntity.SPECIAL_ENTITIES.NARRATOR, narration);

        // add reveal message to global event queue
        GEQ.enqueue(new GameEvent(GameEvent.TYPES.MESSAGE, GameEntity.SPECIAL_ENTITIES.NARRATOR, revealMessage));
    }
}