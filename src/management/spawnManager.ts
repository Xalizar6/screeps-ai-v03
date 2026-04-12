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

    if (upgraders.length < 3) {
      spawn.spawnCreep(DEFAULT_BODY, `upgrader-${Game.time}`, {
        memory: { role: "upgrader" },
      });
      continue;
    }

    const builders = Object.values(Game.creeps).filter(
      (creep): creep is Creep =>
        creep !== undefined && creep.memory.role === "builder",
    );

    const unfinishedSites = spawn.room.find(FIND_CONSTRUCTION_SITES).length;
    const desiredBuilders = Math.ceil(unfinishedSites / 3);

    if (builders.length < desiredBuilders) {
      spawn.spawnCreep(DEFAULT_BODY, `builder-${Game.time}`, {
        memory: { role: "builder" },
      });
    }
  }
};
