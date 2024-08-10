class Encounter
{
    static TYPES = {
        ENEMY_COMMON: 100,
        ENEMY_UNCOMMON: 101,
        ENEMY_RARE: 102,
        ENEMY_EPIC: 103,
        ENEMY_LEGENDARY: 104
    }

    static containsEncounter(room)
    {
        return Object.values(Encounter.TYPES).includes(room.type);
    }

    static fromRoom(biome, room)
    {
        // yeild if the room does not have an encounter
        if(!Encounter.containsEncounter(room)) { return null; }

        return new Encounter(biome, room.type, room.encounterKey);
    }

    constructor(biome, type, encounterKey)
    {
        this.biome = biome;
        this.type = type;
        this.encounterKey = encounterKey;

        // load encounter data
        let encounters = [];

        switch(this.type)
        {
            case Encounter.TYPES.ENEMY_COMMON: encounters = this.biome.commonEncounters; break;
            case Encounter.TYPES.ENEMY_RARE: encounters = this.biome.rareEncounters; break;
            case Encounter.TYPES.ENEMY_EPIC: encounters = this.biome.epicEncounters; break;
            case Encounter.TYPES.ENEMY_LEGENDARY: encounters = this.biome.legendaryEncounters; break;
            default: break;
        }

        const encounter = encounters.find(encounter => encounter.key == this.encounterKey);

        // key state properties
        this.isFaulted = (typeof encounter === "undefined" || encounter === null);
        this.isResolved = false;

        if(this.isFaulted) { return; }

        // map encounter data
        this.name = encounter.name;
        this.allegiance = encounter.allegiance;
        this.baseDisposition = encounter.baseDisposition;
        this.baseLevel = encounter.baseLevel;
        this.baseHealth = encounter.baseHealth;
        this.spriteX = encounter.spriteX;
        this.spriteY = encounter.spriteY;
        this.loot = encounter.loot;
        this.gaurenteedLoot = encounter.gaurenteedLoot;
        this.revealNarration = (Array.isArray(encounter.revealNarration))? encounter.revealNarration: [];
    }

    getDisplayName()
    {       
        let tag = "COMMON";

        switch(this.type)
        {
            case Encounter.TYPES.ENEMY_UNCOMMON: return "UNCOMMON";
            case Encounter.TYPES.ENEMY_RARE: tag = "RARE"; break;
            case Encounter.TYPES.ENEMY_EPIC: tag = "EPIC"; break;
            case Encounter.TYPES.ENEMY_LEGENDARY: tag = "LEGENDARY"; break;
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