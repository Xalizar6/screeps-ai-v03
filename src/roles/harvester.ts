import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";

export const LOG_MODULE = "harvester" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

export const runHarvester = (creep: Creep): void => {
  if (creep.store.getFreeCapacity() === 0) {
    log.path(`${creep.name} branch=full_carry`);
    log.debugLazy(
      () =>
        `${creep.name} energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()}`,
    );
    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
    if (spawn) {
      const result = creep.transfer(spawn, RESOURCE_ENERGY);
      log.debugLazy(
        () => `${creep.name} action=transfer target=${spawn.name} result=${result}`,
      );
      if (result === ERR_NOT_IN_RANGE) {
        const move = creep.moveTo(spawn);
        log.path(`${creep.name} branch=transfer_not_in_range`);
        log.debugLazy(
          () => `${creep.name} action=moveTo target=${spawn.name} result=${move}`,
        );
      }
    } else {
      log.path(`${creep.name} branch=full_carry_no_spawn`);
    }
    return;
  }

  const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  if (source) {
    log.path(`${creep.name} branch=harvest`);
    log.debugLazy(() => `${creep.name} source=${source.id}`);
    const result = creep.harvest(source);
    log.debugLazy(
      () => `${creep.name} action=harvest source=${source.id} result=${result}`,
    );
    if (result === ERR_NOT_IN_RANGE) {
      const move = creep.moveTo(source);
      log.path(`${creep.name} branch=harvest_not_in_range`);
      log.debugLazy(
        () => `${creep.name} action=moveTo source=${source.id} result=${move}`,
      );
    }
  } else {
    log.path(`${creep.name} branch=no_active_source`);
  }
};
