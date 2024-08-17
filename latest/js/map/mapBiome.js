class MapBiome
{
    constructor(key)
    {
        this.isReady = false;
        this.isFaulted = false;

        this.name = null;
        this.theme = null;
        this.commonMapTiles = null;
        this.rareMapTiles = null;
        this.discoverables = null;
        this.commonEncounters = null;
        this.rareEncounters = null;
        this.epicEncounters = null;
        this.legendaryEncounters = null;
        this.loot = null;

        this.spriteLocations = [];

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
        this.commonMapTiles = this.config.data.commonMapTiles;
        this.rareMapTiles = this.config.data.rareMapTiles;
        this.discoverables = this.config.data.discoverables;
        this.commonEncounters = this.config.data.commonEncounters;
        this.rareEncounters = this.config.data.rareEncounters;
        this.epicEncounters = this.config.data.epicEncounters;
        this.legendaryEncounters = this.config.data.legendaryEncounters;
        this.loot = this.config.data.loot;

        this.spriteLocations = this.config.data.spriteLocations;
        this.specialSectors = this.config.data.specialSectors;
        this.generalSectors = this.config.data.generalSectors;

        this.isReady = true;
        this.isFaulted = false;
    }

    getSpriteLocation(type)
    {
        const location = this.spriteLocations.find(candidate => candidate.key == type);

        return (typeof location === "undefined" || location === null)? null : location;
    }

    getSpriteLocationBySymbol(symbol)
    {
        const location = this.spriteLocations.find(candidate => candidate.symbol == symbol);

        return (typeof location === "undefined" || location === null)? null : location;
    }

    determineLoot(target)
    {
        // yeild if the target is invalid
        if(target === null) { return []; }

        // retrieve gaurenteed loot
        const gaurenteedLootKeys = (Array.isArray(target.gaurenteedLoot))? target.gaurenteedLoot: [];
        const gaurenteedLoot = this.loot.filter(loot => gaurenteedLootKeys.includes(loot.key));

        // award gaurenteed loot
        const loot = [...gaurenteedLoot];

        // award additional loot based on rolls
        const maxAdditionalLoot = 1;
        const additionalLootKeys = (Array.isArray(target.loot))? target.loot: [];
        const additionalLoot = [];

        // inline helper function to attempt to award an item of a given rarity
        const awardItem = (rarity) => {
            
            const potentialLoot = this.loot.filter(item => additionalLootKeys.includes(item.key) && item.rarity == rarity);

            if(potentialLoot.length > 0) { additionalLoot.push(GAME.chance.pick(potentialLoot)); }

        };

        let attempts = 0;
        while(additionalLoot.length < maxAdditionalLoot && attempts < 20)
        {
            const roll = GAME.chance.roll(1, 20);

            if(roll == 20) { awardItem("legendary"); }
            else if(roll >= 16) { awardItem("epic"); }
            else if(roll >= 10) { awardItem("rare"); }
            else if(roll >= 6) { awardItem("uncommon"); }
            else { awardItem("common"); }

            attempts++;
        }
        
        // award additional loot
        loot.push(...additionalLoot);
        
        return loot;
    }

}