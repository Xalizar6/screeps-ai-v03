import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";

export const LOG_MODULE = "builder" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

export const runBuilder = (creep: Creep): void => {
  if (creep.store[RESOURCE_ENERGY] === 0) {
    log.path(`${creep.name} branch=empty_carry`);
    log.debugLazy(
      () =>
        `${creep.name} energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()}`,
    );
    const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    if (source) {
      log.path(`${creep.name} branch=pull_energy`);
      const result = creep.harvest(source);
      log.debugLazy(
        () =>
          `${creep.name} action=harvest source=${source.id} result=${result}`,
      );
      if (result === ERR_NOT_IN_RANGE) {
        const move = creep.moveTo(source);
        log.path(`${creep.name} branch=harvest_not_in_range`);
        log.debugLazy(
          () =>
            `${creep.name} action=moveTo source=${source.id} result=${move}`,
        );
      }
    } else {
      log.path(`${creep.name} branch=no_active_source`);
    }
    return;
  }

  const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  if (site) {
    log.path(`${creep.name} branch=build`);
    log.debugLazy(
      () =>
        `${creep.name} energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()} site=${site.id}`,
    );
    const result = creep.build(site);
    log.debugLazy(
      () => `${creep.name} action=build site=${site.id} result=${result}`,
    );
    if (result === ERR_NOT_IN_RANGE) {
      const move = creep.moveTo(site);
      log.path(`${creep.name} branch=build_not_in_range`);
      log.debugLazy(
        () => `${creep.name} action=moveTo site=${site.id} result=${move}`,
      );
    }
  } else {
    log.path(`${creep.name} branch=no_construction_site`);
  }
};
