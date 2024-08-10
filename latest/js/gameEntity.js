class GameEntity
{
    static DESIGNATIONS = {
        UNKNOWN: 0,
        SERVER: 1,
        CLIENT: 2,
        ADMIN: 3,
        SPECIAL: 4,
        ROOM: 5,
        PLAYER: 7,
        NPC: 8,
        ITEM: 9,
        BUFF: 10,
        DEBUFF: 11
    };

    static SPECIAL_ENTITIES = {
        ERROR: new GameEntity(GameEntity.DESIGNATIONS.CLIENT, "ERROR"),
        WARNING: new GameEntity(GameEntity.DESIGNATIONS.CLIENT, "WARNING"),
        DIAGNOSTIC: new GameEntity(GameEntity.DESIGNATIONS.CLIENT, "DIAGNOSTIC"),
        NARRATOR: new GameEntity(GameEntity.DESIGNATIONS.SPECIAL, "NARRATOR")
    };

    constructor(designation, name)
    {
        this.designation = designation;
        this.name = name;
    }
}