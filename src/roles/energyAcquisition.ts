import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import { getObjectByIdOrNull, resolveSource } from "./fsm";

export const LOG_MODULE = "energyAcquisition" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

function findBestSourceContainer(
  creep: Creep,
  need: number,
): StructureContainer | null {
  const sourcesMem = creep.room.memory.sources;
  if (!sourcesMem) {
    return null;
  }
  let best: StructureContainer | null = null;
  let bestRange = Infinity;
  for (const sourceIdStr of Object.keys(sourcesMem)) {
    const sourceId = sourceIdStr as Id<Source>;
    const entry = sourcesMem[sourceId];
    if (!entry?.containerId) {
      continue;
    }
    const container = Game.getObjectById(entry.containerId);
    if (!(container instanceof StructureContainer)) {
      continue;
    }
    if (container.store[RESOURCE_ENERGY] < need) {
      continue;
    }
    const range = creep.pos.getRangeTo(container.pos);
    if (range < bestRange) {
      bestRange = range;
      best = container;
    }
  }
  return best;
}

function findDroppedEnergyNearSources(creep: Creep): Resource | null {
  const sourcesMem = creep.room.memory.sources;
  if (!sourcesMem) {
    return null;
  }
  let best: Resource | null = null;
  let bestRange = Infinity;
  for (const sourceIdStr of Object.keys(sourcesMem)) {
    const sourceId = sourceIdStr as Id<Source>;
    const source = Game.getObjectById(sourceId);
    if (!(source instanceof Source)) {
      continue;
    }
    const dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
    for (const r of dropped) {
      if (r.resourceType !== RESOURCE_ENERGY || r.amount <= 0) {
        continue;
      }
      const range = creep.pos.getRangeTo(r.pos);
      if (range < bestRange) {
        bestRange = range;
        best = r;
      }
    }
  }
  return best;
}

function tryActOnCachedTarget(creep: Creep, need: number): boolean {
  const raw = getObjectByIdOrNull<
    | Source
    | StructureContainer
    | Resource
    | StructureSpawn
    | ConstructionSite
    | StructureController
  >(creep.memory.targetId);

  if (raw instanceof StructureContainer) {
    if (raw.store[RESOURCE_ENERGY] >= need) {
      const result = creep.withdraw(raw, RESOURCE_ENERGY);
      log.debugLazy(
        () =>
          `${creep.name} action=withdraw container=${raw.id} result=${result}`,
      );
      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(raw);
        log.path(`${creep.name} branch=withdraw_not_in_range`);
        return true;
      }
      if (result === ERR_NOT_ENOUGH_RESOURCES) {
        delete creep.memory.targetId;
        return false;
      }
      return result === OK || result === ERR_FULL;
    }
    delete creep.memory.targetId;
    return false;
  }

  if (raw instanceof Resource && raw.resourceType === RESOURCE_ENERGY) {
    const result = creep.pickup(raw);
    log.debugLazy(
      () => `${creep.name} action=pickup resource=${raw.id} result=${result}`,
    );
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(raw);
      log.path(`${creep.name} branch=pickup_not_in_range`);
      return true;
    }
    if (result === ERR_INVALID_TARGET) {
      delete creep.memory.targetId;
      return false;
    }
    return result === OK || result === ERR_FULL;
  }

  if (raw instanceof Source) {
    const result = creep.harvest(raw);
    log.debugLazy(
      () => `${creep.name} action=harvest source=${raw.id} result=${result}`,
    );
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(raw);
      log.path(`${creep.name} branch=harvest_not_in_range`);
      return true;
    }
    if (result === ERR_NOT_ENOUGH_RESOURCES) {
      delete creep.memory.targetId;
      return false;
    }
    return result === OK;
  }

  if (raw) {
    delete creep.memory.targetId;
  }
  return false;
}

/**
 * Acquire energy: withdraw from source-adjacent containers (if enough energy),
 * else pickup dropped energy near sources, else harvest from an active source.
 */
export function acquireEnergy(creep: Creep): void {
  const need = creep.store.getFreeCapacity(RESOURCE_ENERGY);
  if (need <= 0) {
    return;
  }

  log.path(`${creep.name} branch=empty_carry`);
  log.debugLazy(
    () =>
      `${creep.name} energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()} need=${need}`,
  );

  if (creep.memory.targetId && tryActOnCachedTarget(creep, need)) {
    return;
  }

  const sourcesMem = creep.room.memory.sources;
  if (sourcesMem) {
    const container = findBestSourceContainer(creep, need);
    if (container) {
      creep.memory.targetId = container.id;
      log.path(`${creep.name} branch=withdraw_container`);
      const result = creep.withdraw(container, RESOURCE_ENERGY);
      log.debugLazy(
        () =>
          `${creep.name} action=withdraw container=${container.id} result=${result}`,
      );
      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(container);
        log.path(`${creep.name} branch=withdraw_not_in_range`);
      }
      return;
    }

    const dropped = findDroppedEnergyNearSources(creep);
    if (dropped) {
      creep.memory.targetId = dropped.id;
      log.path(`${creep.name} branch=pickup_dropped`);
      const result = creep.pickup(dropped);
      log.debugLazy(
        () =>
          `${creep.name} action=pickup resource=${dropped.id} result=${result}`,
      );
      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(dropped);
        log.path(`${creep.name} branch=pickup_not_in_range`);
      }
      return;
    }
  }

  const source = resolveSource(creep);
  if (!source) {
    log.path(`${creep.name} branch=no_active_source`);
    return;
  }
  log.path(`${creep.name} branch=harvest_fallback`);
  const result = creep.harvest(source);
  log.debugLazy(
    () => `${creep.name} action=harvest source=${source.id} result=${result}`,
  );
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(source);
    log.path(`${creep.name} branch=harvest_not_in_range`);
  }
}
