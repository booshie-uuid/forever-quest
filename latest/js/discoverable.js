class Discoverable extends Lootable
{
    static containsDiscoverable(room)
    {
        return room.type == Room.TYPES.DISCOVERABLE;
    }

    static getRandomKey(biome, room)
    {
        let discoverables = biome.discoverables.filter(discoverable => discoverable.rarity == room.rarity);

        if(typeof discoverables === "undefined" || discoverables === null || discoverables.length == 0) { return null; }

        return SharedChance.pick(discoverables).key;
    }

    static fromRoom(biome, room)
    {
        // yeild if the room does not have an encounter
        if(!Discoverable.containsDiscoverable(room)) { return null; }

        return new Discoverable(biome, room.rarity, room.childKey);
    }

    constructor(biome, rarity, discoverableKey)
    {
        const discoverable = biome.discoverables.find(discoverable => discoverable.key == discoverableKey);

        if(typeof discoverable === "undefined" || discoverable === null)
        {
            // yield if the discoverable data can't be loaded
            super(GameEntity.DESIGNATIONS.UNKNOWN, "UNKNOWN", null);
            this.isFaulted = true;

            return;
        }

        super(discoverable.designation, discoverable.name, biome);

        this.rarity = rarity;
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

        switch(this.rarity)
        {
            case Room.RARITY.UNCOMMON: return "UNCOMMON";
            case Room.RARITY.RARE: tag = "RARE"; break;
            case Room.RARITY.EPIC: tag = "EPIC"; break;
            case Room.RARITY.LEGENDARY: tag = "LEGENDARY"; break;
            case Room.RARITY.SPECIAL: tag = "SPECIAL"; break;
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