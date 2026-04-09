const DEFAULT_BODY: BodyPartConstant[] = [WORK, CARRY, MOVE];

export const runSpawnManagement = (): void => {
  for (const spawnName in Game.spawns) {
    const spawn = Game.spawns[spawnName];

    if (spawn.spawning) {
      continue;
    }

    const harvesters = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === "harvester"
    );

    if (harvesters.length < 2) {
      spawn.spawnCreep(DEFAULT_BODY, `harvester-${Game.time}`, {
        memory: { role: "harvester" },
      });
      continue;
    }

    const builders = _.filter(
      Game.creeps,
      (creep) => creep.memory.role === "builder"
    );

    if (builders.length < 1) {
      spawn.spawnCreep(DEFAULT_BODY, `builder-${Game.time}`, {
        memory: { role: "builder" },
      });
    }
  }
};
