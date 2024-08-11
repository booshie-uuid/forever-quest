class GameEntity
{
    static DESIGNATIONS = {
        UNKNOWN: "unknown",
        SYSTEM: "system",
        ADMIN: "admin",
        SPECIAL: "special",
        ROOM: "room",
        CONTAINER: "container",
        PLAYER: "player",
        NPC: "npc",
        ITEM: "item",
        BUFF: "buff",
        DEBUFF: "debuff"
    };

    static SPECIAL_ENTITIES = {
        ERROR: new GameEntity(GameEntity.DESIGNATIONS.SYSTEM, "ERROR"),
        WARNING: new GameEntity(GameEntity.DESIGNATIONS.SYSTEM, "WARNING"),
        DIAGNOSTIC: new GameEntity(GameEntity.DESIGNATIONS.SYSTEM, "DIAGNOSTIC"),
        NARRATOR: new GameEntity(GameEntity.DESIGNATIONS.SPECIAL, "NARRATOR"),
        MAP: new GameEntity(GameEntity.DESIGNATIONS.SPECIAL, "MAP")
    };

    constructor(designation, name)
    {
        this.designation = (typeof designation === "undefined" || designation == null)? GameEntity.DESIGNATIONS.UNKNOWN: designation;
        this.name = name;
    }
}