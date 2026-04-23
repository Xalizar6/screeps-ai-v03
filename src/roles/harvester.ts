import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import { getShuttleCreepCountInRoom } from "../management/creepSnapshot";
import {
  isStoreEmpty,
  isStoreFull,
  resolveSource,
  runFsm,
  transitionState,
} from "./fsm";

export const LOG_MODULE = "harvester" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

type HarvesterState = "harvest" | "deliver";
type FallbackDeliveryTarget = StructureSpawn | StructureExtension;

function ensureState(creep: Creep): HarvesterState {
  if (creep.memory.state !== "harvest" && creep.memory.state !== "deliver") {
    creep.memory.state = "harvest";
    creep.memory.stateSinceTick = Game.time;
  }
  return creep.memory.state === "deliver" ? "deliver" : "harvest";
}

function resolveAssignedSource(creep: Creep): Source | null {
  const sourceId = creep.memory.sourceId;
  if (sourceId) {
    const assigned = Game.getObjectById(sourceId);
    if (assigned instanceof Source) {
      return assigned;
    }
    delete creep.memory.sourceId;
  }

  const fallback = resolveSource(creep);
  if (fallback) {
    creep.memory.sourceId = fallback.id;
  }
  return fallback;
}

function resolveSourceContainer(
  creep: Creep,
  source: Source,
): StructureContainer | null {
  const sourceMem = creep.room.memory.sources?.[source.id];
  if (!sourceMem?.containerId) {
    return null;
  }
  const container = Game.getObjectById(sourceMem.containerId);
  if (container instanceof StructureContainer) {
    return container;
  }
  delete sourceMem.containerId;
  return null;
}

function resolveFallbackDeliveryTarget(
  creep: Creep,
): FallbackDeliveryTarget | null {
  const raw = creep.memory.targetId
    ? Game.getObjectById(creep.memory.targetId)
    : null;
  if (
    raw &&
    (raw instanceof StructureSpawn || raw instanceof StructureExtension) &&
    raw.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  ) {
    return raw;
  }
  if (raw) {
    delete creep.memory.targetId;
  }

  const targets = creep.room.find(FIND_MY_STRUCTURES, {
    filter: (structure): structure is FallbackDeliveryTarget =>
      (structure.structureType === STRUCTURE_SPAWN ||
        structure.structureType === STRUCTURE_EXTENSION) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
  });
  const target = creep.pos.findClosestByPath(targets);
  if (target) {
    creep.memory.targetId = target.id;
    return target;
  }
  return null;
}

function roomHasEnergyAcceptingSpawnOrExtensions(room: Room): boolean {
  return (
    room.find(FIND_MY_STRUCTURES, {
      filter: (structure) =>
        (structure.structureType === STRUCTURE_SPAWN ||
          structure.structureType === STRUCTURE_EXTENSION) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
    }).length > 0
  );
}

function runHarvest(creep: Creep): void {
  const shuttleCreeps = getShuttleCreepCountInRoom(creep.room.name);
  if (shuttleCreeps === 0 && isStoreFull(creep)) {
    transitionState(creep, "deliver");
    return;
  }

  const source = resolveAssignedSource(creep);
  if (!source) {
    log.path(`${creep.name} branch=no_source`);
    return;
  }

  const sourceContainer = resolveSourceContainer(creep, source);
  const emergency =
    shuttleCreeps === 0 && roomHasEnergyAcceptingSpawnOrExtensions(creep.room);
  const container = emergency ? null : sourceContainer;

  if (container) {
    if (!creep.pos.isEqualTo(container.pos)) {
      const move = creep.moveTo(container);
      log.path(`${creep.name} branch=move_to_container`);
      log.debugLazy(
        () =>
          `${creep.name} action=moveTo container=${container.id} result=${move}`,
      );
      return;
    }
  } else if (creep.pos.getRangeTo(source) > 1) {
    const move = creep.moveTo(source);
    log.path(`${creep.name} branch=move_to_source`);
    log.debugLazy(
      () => `${creep.name} action=moveTo source=${source.id} result=${move}`,
    );
    return;
  }

  const containerHasRoom =
    !container || container.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
  const carryHasRoom = !isStoreFull(creep);
  if (!containerHasRoom && !carryHasRoom) {
    log.path(`${creep.name} branch=idle_container_full`);
    return;
  }

  log.path(
    `${creep.name} branch=${emergency ? "emergency_mine_source" : "mine_source"}`,
  );
  const harvest = creep.harvest(source);
  log.debugLazy(
    () => `${creep.name} action=harvest source=${source.id} result=${harvest}`,
  );

  const carried = creep.store[RESOURCE_ENERGY];
  if (carried > 0) {
    if (container) {
      const transfer = creep.transfer(container, RESOURCE_ENERGY);
      log.debugLazy(
        () =>
          `${creep.name} action=transfer container=${container.id} amount=${carried} result=${transfer}`,
      );
    } else if (!emergency) {
      const dropped = creep.drop(RESOURCE_ENERGY);
      log.debugLazy(
        () => `${creep.name} action=drop amount=${carried} result=${dropped}`,
      );
    }
  }

  if (shuttleCreeps === 0 && isStoreFull(creep)) {
    transitionState(creep, "deliver");
  }
}

function runDeliver(creep: Creep): void {
  if (getShuttleCreepCountInRoom(creep.room.name) > 0) {
    transitionState(creep, "harvest");
    return;
  }
  if (isStoreEmpty(creep)) {
    transitionState(creep, "harvest");
    return;
  }
  log.path(`${creep.name} branch=fallback_deliver`);
  log.debugLazy(
    () =>
      `${creep.name} energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()}`,
  );
  const target = resolveFallbackDeliveryTarget(creep);
  if (!target) {
    log.path(`${creep.name} branch=fallback_no_target`);
    return;
  }
  const result = creep.transfer(target, RESOURCE_ENERGY);
  log.debugLazy(
    () =>
      `${creep.name} action=transfer target=${target.id} type=${target.structureType} result=${result}`,
  );
  if (result === ERR_NOT_IN_RANGE) {
    const move = creep.moveTo(target);
    log.path(`${creep.name} branch=fallback_not_in_range`);
    log.debugLazy(
      () => `${creep.name} action=moveTo target=${target.id} result=${move}`,
    );
  }
}

/** Main loop entry: mine at source (or fallback deliver), with same-tick re-dispatch after FSM transitions. */
export const runHarvester = (creep: Creep): void => {
  runFsm(creep, () => {
    const state = ensureState(creep);
    if (state === "deliver") {
      runDeliver(creep);
    } else {
      runHarvest(creep);
    }
  });
};
