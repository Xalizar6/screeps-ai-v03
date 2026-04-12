export const LOG_MODULE = "spawnManager" as const;

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
        creep !== undefined && creep.memory.role === "harvester",
    );

    if (harvesters.length < 2) {
      spawn.spawnCreep(DEFAULT_BODY, `harvester-${Game.time}`, {
        memory: { role: "harvester" },
      });
      continue;
    }

    const upgraders = Object.values(Game.creeps).filter(
      (creep): creep is Creep =>
        creep !== undefined && creep.memory.role === "upgrader",
    );

    if (upgraders.length < 2) {
      spawn.spawnCreep(DEFAULT_BODY, `upgrader-${Game.time}`, {
        memory: { role: "upgrader" },
      });
      continue;
    }

    const builders = Object.values(Game.creeps).filter(
      (creep): creep is Creep =>
        creep !== undefined && creep.memory.role === "builder",
    );

    const hasConstructionSite =
      spawn.room.find(FIND_CONSTRUCTION_SITES).length > 0;

    if (builders.length < 1 && hasConstructionSite) {
      spawn.spawnCreep(DEFAULT_BODY, `builder-${Game.time}`, {
        memory: { role: "builder" },
      });
    }
  }
};
