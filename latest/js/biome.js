class Biome
{
    constructor(key)
    {
        this.isReady = false;
        this.isFaulted = false;

        this.name = null;
        this.theme = null;
        this.commonRooms = null;
        this.rareRooms = null;
        this.features = null;
        this.commonEncounters = null;
        this.rareEncounters = null;
        this.epicEncounters = null;
        this.legendaryEncounters = null;
        this.loot = null;

        this.config = new GameData(`biomes/${key}.json`, this.unpackConfig.bind(this));
    }

    unpackConfig()
    {
        // fault and yeild if the config failed to load
        if(!this.config.isReady)
        {
            this.isFaulted = true;
            return;
        }

        this.name = this.config.data.name;
        this.theme = this.config.data.theme;
        this.commonRooms = this.config.data.commonRooms;
        this.rareRooms = this.config.data.rareRooms;
        this.features = this.config.data.features;
        this.commonEncounters = this.config.data.commonEncounters;
        this.rareEncounters = this.config.data.rareEncounters;
        this.epicEncounters = this.config.data.epicEncounters;
        this.legendaryEncounters = this.config.data.legendaryEncounters;
        this.loot = this.config.data.loot;

        this.isReady = true;
        this.isFaulted = false;
    }

    determineLoot(target, chance)
    {
        // yeild if the target is invalid
        if(target === null) { return []; }

        // determine rarity of potential loot based on chance
        const roll = chance.roll(1, 20);
        let rarity = "common";

        if(roll == 20) { rarity = "legendary"; }
        else if(roll >= 16) { rarity = "epic"; }
        else if(roll >= 10) { rarity = "rare"; }
        else if(roll >= 6) { rarity = "uncommon"; }
        else { rarity = "common"; }
        
        // retrieve potential loot
        const potentialLootKeys = (Array.isArray(target.loot))? target.loot: [];
        const potentialLoot = this.loot.filter(loot => potentialLootKeys.includes(loot.key) && loot.rarity == rarity);

        // retrieve gaurenteed loot
        const gaurenteedLootKeys = (Array.isArray(target.gaurenteedLoot))? target.gaurenteedLoot: [];
        const gaurenteedLoot = this.loot.filter(loot => gaurenteedLootKeys.includes(loot.key));

        // award gaurenteed loot
        const loot = [...gaurenteedLoot];

        // award one item from list of potential loot
        const randomItem = chance.pick(potentialLoot);
        if(randomItem !== null) { loot.push(randomItem); }
        
        return loot;
    }

}