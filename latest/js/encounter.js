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
}