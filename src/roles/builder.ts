import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import { acquireEnergy } from "./energyAcquisition";
import { isStoreEmpty, isStoreFull, runFsm, transitionState } from "./fsm";

export const LOG_MODULE = "builder" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

type BuilderState = "harvest" | "build";

function ensureState(creep: Creep): BuilderState {
  if (creep.memory.state !== "harvest" && creep.memory.state !== "build") {
    creep.memory.state = "harvest";
    creep.memory.stateSinceTick = Game.time;
  }
  return creep.memory.state === "build" ? "build" : "harvest";
}

function resolveSite(creep: Creep): ConstructionSite | null {
  const raw = creep.memory.targetId
    ? Game.getObjectById(creep.memory.targetId)
    : null;
  if (raw instanceof ConstructionSite) {
    return raw;
  }
  if (raw) {
    delete creep.memory.targetId;
  }
  const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  if (site) {
    creep.memory.targetId = site.id;
  }
  return site;
}

function runHarvest(creep: Creep): void {
  if (isStoreFull(creep)) {
    transitionState(creep, "build");
    return;
  }
  acquireEnergy(creep);
}

function runBuild(creep: Creep): void {
  if (isStoreEmpty(creep)) {
    transitionState(creep, "harvest");
    return;
  }
  const site = resolveSite(creep);
  if (!site) {
    log.path(`${creep.name} branch=no_construction_site`);
    return;
  }
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
}

/** Main loop entry: harvest energy or build construction sites, with same-tick re-dispatch after FSM transitions. */
export const runBuilder = (creep: Creep): void => {
  if (creep.room.find(FIND_CONSTRUCTION_SITES).length === 0) {
    log.path(`${creep.name} branch=suicide_no_construction_sites`);
    creep.suicide();
    return;
  }

  runFsm(creep, () => {
    const state = ensureState(creep);
    if (state === "build") {
      runBuild(creep);
    } else {
      runHarvest(creep);
    }
  });
};
