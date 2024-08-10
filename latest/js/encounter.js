class Encounter extends Lootable
{
    static containsEncounter(room)
    {
        return room.type == Room.TYPES.ENCOUNTER;
    }

    static getRandomKey(biome, room)
    {
        let encounters = [];

        switch(room.rarity)
        {
            case Room.RARITY.COMMON: encounters = biome.commonEncounters; break;
            case Room.RARITY.RARE: encounters = biome.rareEncounters; break;
            case Room.RARITY.EPIC: encounters = biome.epicEncounters; break;
            case Room.RARITY.LEGENDARY: encounters = biome.legendaryEncounters; break;
            default: break;
        }

        if(typeof encounters === "undefined" || encounters === null || encounters.length == 0) { return null; }

        return SharedChance.pick(encounters).key;
    }

    static fromRoom(biome, room)
    {
        // yeild if the room does not have an encounter
        if(!Encounter.containsEncounter(room)) { return null; }

        return new Encounter(biome, room.rarity, room.childKey);
    }

    constructor(biome, rarity, encounterKey)
    {
        // load encounter data
        let encounters = [];

        switch(rarity)
        {
            case Room.RARITY.COMMON: encounters = biome.commonEncounters; break;
            case Room.RARITY.RARE: encounters = biome.rareEncounters; break;
            case Room.RARITY.EPIC: encounters = biome.epicEncounters; break;
            case Room.RARITY.LEGENDARY: encounters = biome.legendaryEncounters; break;
            default: break;
        }

        const encounterData = encounters.find(encounter => encounter.key == encounterKey);

        if(typeof encounterData === "undefined" || encounterData === null)
        {
            // yield if the encounter data can't be loaded
            super(GameEntity.DESIGNATIONS.UNKNOWN, "UNKNOWN", null);
            this.isFaulted = true;
            
            return;
        }

        // initialise inherited properties
        super(encounterData.designation, encounterData.name, biome);

        // key state properties
        this.isFaulted = false;
        this.isResolved = false;

        this.rarity = rarity;
        this.encounterKey = encounterKey;

        if(this.isFaulted) { return; }

        // map encounter data
        this.name = encounterData.name;
        this.allegiance = encounterData.allegiance;
        this.baseDisposition = encounterData.baseDisposition;
        this.baseLevel = encounterData.baseLevel;
        this.baseHealth = encounterData.baseHealth;
        this.spriteX = encounterData.spriteX;
        this.spriteY = encounterData.spriteY;
        this.revealNarration = (Array.isArray(encounterData.revealNarration))? encounterData.revealNarration: [];

        super.setLoot([encounterData.gaurenteedLoot], encounterData.possibleLoot);
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
            default: tag = "COMMON"; break;
        }

        return `[${tag}][${this.name}][/${tag}]`;
    }

    triggerRevealNarration()
    {
        let narration = (this.revealNarration.length > 0)? SharedChance.pick(this.revealNarration).text: "You have encountered @NAME!";

        let article = Grammar.getIndefiniteArticle(this.name);
        let prefix = (article)? `${article} ` : "";

        narration = narration.replace("@NAME", `${prefix}${this.getDisplayName()}`);

        // prepare a message for the player revealing the encounter
        const revealMessage = new ChatMessage(ChatMessage.TYPES.SHOUT, GameEntity.SPECIAL_ENTITIES.NARRATOR, narration);

        // add reveal message to global event queue
        GEQ.enqueue(new GameEvent(GameEvent.TYPES.MESSAGE, GameEntity.SPECIAL_ENTITIES.NARRATOR, revealMessage));
    }

}