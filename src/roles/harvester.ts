import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import { isStoreEmpty, isStoreFull, transitionState } from "./fsm";

export const LOG_MODULE = "harvester" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

type HarvesterState = "harvest" | "deliver";

function ensureState(creep: Creep): HarvesterState {
  if (creep.memory.state !== "harvest" && creep.memory.state !== "deliver") {
    creep.memory.state = "harvest";
    creep.memory.stateSinceTick = Game.time;
  }
  return creep.memory.state === "deliver" ? "deliver" : "harvest";
}

function resolveSource(creep: Creep): Source | null {
  const raw = creep.memory.targetId
    ? Game.getObjectById(creep.memory.targetId)
    : null;
  if (raw instanceof Source) {
    return raw;
  }
  if (raw) {
    delete creep.memory.targetId;
  }
  const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  if (source) {
    creep.memory.targetId = source.id;
  }
  return source;
}

function resolveSpawn(creep: Creep): StructureSpawn | null {
  const raw = creep.memory.targetId
    ? Game.getObjectById(creep.memory.targetId)
    : null;
  if (raw instanceof StructureSpawn) {
    return raw;
  }
  if (raw) {
    delete creep.memory.targetId;
  }
  const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
  if (spawn) {
    creep.memory.targetId = spawn.id;
  }
  return spawn ?? null;
}

function runHarvest(creep: Creep): void {
  if (isStoreFull(creep)) {
    transitionState(creep, "deliver");
    return;
  }
  const source = resolveSource(creep);
  if (!source) {
    log.path(`${creep.name} branch=no_active_source`);
    return;
  }
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
}

function runDeliver(creep: Creep): void {
  if (isStoreEmpty(creep)) {
    transitionState(creep, "harvest");
    return;
  }
  log.path(`${creep.name} branch=full_carry`);
  log.debugLazy(
    () =>
      `${creep.name} energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()}`,
  );
  const spawn = resolveSpawn(creep);
  if (!spawn) {
    log.path(`${creep.name} branch=full_carry_no_spawn`);
    return;
  }
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
}

export const runHarvester = (creep: Creep): void => {
  const state = ensureState(creep);
  if (state === "deliver") {
    runDeliver(creep);
  } else {
    runHarvest(creep);
  }
};
