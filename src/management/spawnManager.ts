import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import { countRepairBacklog } from "./repairConfig";
import { getUnfilledEnergyStructures } from "./structureCache";

export const LOG_MODULE = "spawnManager" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

const DEFAULT_BODY: BodyPartConstant[] = [WORK, CARRY, MOVE];

export const runSpawnManagement = (): void => {
  for (const spawnName in Game.spawns) {
    const spawn = Game.spawns[spawnName];
    if (!spawn) {
      continue;
    }

    const spawningNow = spawn.spawning;
    if (spawningNow) {
      log.debugLazy(
        () =>
          `spawn=${spawn.name} skip=already_spawning current=${spawningNow.name}`,
      );
      continue;
    }

    const harvesters = Object.values(Game.creeps).filter(
      (creep): creep is Creep =>
        creep !== undefined && creep.memory.role === "harvester",
    );

    if (harvesters.length < 2) {
      const code = spawn.spawnCreep(DEFAULT_BODY, `harvester-${Game.time}`, {
        memory: { role: "harvester" },
      });
      log.debugLazy(
        () =>
          `spawn=${spawn.name} branch=harvester have=${harvesters.length} need=2 bodyCost=${bodyCost(
            DEFAULT_BODY,
          )} energy=${spawn.room.energyAvailable} code=${code}`,
      );
      continue;
    }

    const shuttles = Object.values(Game.creeps).filter(
      (creep): creep is Creep =>
        creep !== undefined && creep.memory.role === "shuttle",
    );
    const unfilled = getUnfilledEnergyStructures(spawn.room);
    const desiredShuttles = Math.max(1, Math.ceil(unfilled.length / 4));
    if (shuttles.length < desiredShuttles) {
      const code = spawn.spawnCreep(DEFAULT_BODY, `shuttle-${Game.time}`, {
        memory: { role: "shuttle" },
      });
      log.debugLazy(
        () =>
          `spawn=${spawn.name} branch=shuttle have=${shuttles.length} desired=${desiredShuttles} unfilled=${unfilled.length} bodyCost=${bodyCost(
            DEFAULT_BODY,
          )} energy=${spawn.room.energyAvailable} code=${code}`,
      );
      continue;
    }

    const upgraders = Object.values(Game.creeps).filter(
      (creep): creep is Creep =>
        creep !== undefined && creep.memory.role === "upgrader",
    );

    if (upgraders.length < 3) {
      const code = spawn.spawnCreep(DEFAULT_BODY, `upgrader-${Game.time}`, {
        memory: { role: "upgrader" },
      });
      log.debugLazy(
        () =>
          `spawn=${spawn.name} branch=upgrader have=${upgraders.length} need=3 bodyCost=${bodyCost(
            DEFAULT_BODY,
          )} energy=${spawn.room.energyAvailable} code=${code}`,
      );
      continue;
    }

    const builders = Object.values(Game.creeps).filter(
      (creep): creep is Creep =>
        creep !== undefined && creep.memory.role === "builder",
    );

    const unfinishedSites = spawn.room.find(FIND_CONSTRUCTION_SITES).length;
    const desiredBuilders = Math.ceil(unfinishedSites / 3);

    if (builders.length < desiredBuilders) {
      const code = spawn.spawnCreep(DEFAULT_BODY, `builder-${Game.time}`, {
        memory: { role: "builder" },
      });
      log.debugLazy(
        () =>
          `spawn=${spawn.name} branch=builder have=${builders.length} desired=${desiredBuilders} sites=${unfinishedSites} bodyCost=${bodyCost(
            DEFAULT_BODY,
          )} energy=${spawn.room.energyAvailable} code=${code}`,
      );
      continue;
    }

    const repairers = Object.values(Game.creeps).filter(
      (creep): creep is Creep =>
        creep !== undefined && creep.memory.role === "repairer",
    );

    const repairBacklog = countRepairBacklog(spawn.room);
    const desiredRepairers = Math.ceil(repairBacklog / 3);
    const needMoreRepairers = repairers.length < desiredRepairers;

    log.debugLazy(
      () =>
        `spawn=${spawn.name} branch=repair backlog=${repairBacklog} desiredRepairers=${desiredRepairers} repairers=${repairers.length} needSpawn=${needMoreRepairers} energy=${spawn.room.energyAvailable} bodyCost=${bodyCost(DEFAULT_BODY)}`,
    );

    if (needMoreRepairers) {
      const code = spawn.spawnCreep(DEFAULT_BODY, `repairer-${Game.time}`, {
        memory: { role: "repairer" },
      });
      log.debugLazy(
        () =>
          `spawn=${spawn.name} action=spawnRepairer code=${code} name=repairer-${Game.time}`,
      );
    }
  }
};

function bodyCost(body: BodyPartConstant[]): number {
  let sum = 0;
  for (const part of body) {
    sum += BODYPART_COST[part];
  }
  return sum;
}
