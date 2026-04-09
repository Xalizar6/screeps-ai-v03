const DEFAULT_BODY: BodyPartConstant[] = [WORK, CARRY, MOVE];

export const runSpawnManagement = (): void => {
  for (const spawnName in Game.spawns) {
    const spawn = Game.spawns[spawnName];
    if (!spawn) {
      continue;
    }

    if (spawn.spawning) {
      continue;
    }

    const harvesters = Object.values(Game.creeps).filter(
      (creep): creep is Creep =>
        creep !== undefined && creep.memory.role === "harvester"
    );

    if (harvesters.length < 2) {
      spawn.spawnCreep(DEFAULT_BODY, `harvester-${Game.time}`, {
        memory: { role: "harvester" },
      });
      continue;
    }

    const builders = Object.values(Game.creeps).filter(
      (creep): creep is Creep =>
        creep !== undefined && creep.memory.role === "builder"
    );

    if (builders.length < 1) {
      spawn.spawnCreep(DEFAULT_BODY, `builder-${Game.time}`, {
        memory: { role: "builder" },
      });
    }
  }
};
