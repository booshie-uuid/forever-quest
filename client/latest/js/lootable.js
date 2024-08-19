class Lootable extends GameEntity
{
    constructor(designation, name, biome)
    {
        super(designation, name);

        this.biome = biome;
        
        this.isLootable = false;

        this.gaurenteedLoot = [];
        this.possibleLoot = [];
    }

    setLoot(gaurenteedLoot, possibleLoot)
    {
        this.gaurenteedLoot = (Array.isArray(gaurenteedLoot))? gaurenteedLoot : [];
        this.possibleLoot = (Array.isArray(possibleLoot))? possibleLoot : [];

        this.isLootable = this.gaurenteedLoot.length > 0 || this.possibleLoot.length > 0;
    }
}