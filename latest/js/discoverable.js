class Discoverable
{
    static TYPES = {
        EXIT: 200,
        TREASURE_COMMON: 201,
        TREASURE_UNCOMMON: 202,
        TREASURE_RARE: 203,
        TREASURE_EPIC: 204,
        TREASURE_LEGENDARY: 205
    }

    static containsDiscoverable(room)
    {
        return Object.values(Discoverable.TYPES).includes(room.type);
    }

    static fromRoom(biome, room)
    {
        // yeild if the room does not have an encounter
        if(!Discoverable.containsDiscoverable(room)) { return null; }

        return new Discoverable(biome, room.type);
    }

    constructor(biome, type)
    {
        this.biome = biome;
        this.type = type;

        const discoverable = this.biome.discoverables.find(discoverable => discoverable.key == this.type);

        this.isFaulted = (typeof discoverable === "undefined" || discoverable === null);

        if(this.isFaulted) { return; }

        this.name = discoverable.name;
        this.isExit = discoverable.isExit;
        this.isLootable = discoverable.isLootable;
        this.spriteX = discoverable.spriteX;
        this.spriteY = discoverable.spriteY;
        this.loot = Array.isArray(discoverable.loot)? discoverable.loot : [];
        this.revealNarration = (Array.isArray(discoverable.revealNarration))? discoverable.revealNarration: [];
    }

    getDisplayName()
    {
        let tag = "COMMON";

        switch(this.type)
        {
            case Discoverable.TYPES.TREASURE_UNCOMMON: return "UNCOMMON";
            case Discoverable.TYPES.TREASURE_RARE: tag = "RARE"; break;
            case Discoverable.TYPES.TREASURE_EPIC: tag = "EPIC"; break;
            case Discoverable.TYPES.TREASURE_LEGENDARY: tag = "LEGENDARY"; break;
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