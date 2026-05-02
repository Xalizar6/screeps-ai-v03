import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import { getObjectByIdOrNull, resolveSource } from "./fsm";

export const LOG_MODULE = "energyAcquisition" as const;

const log = createLogger(LOG_MODULE, {
  defaultLevel: LogLevel.Information,
  group: "roles",
});

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

/**
 * True if dropped energy is within 1 tile of any source listed in `RoomMemory.sources`.
 */
function isDroppedEnergyAdjacentToSource(
  creep: Creep,
  resource: Resource,
): boolean {
  const sourcesMem = creep.room.memory.sources;
  if (!sourcesMem) {
    return false;
  }
  for (const sourceIdStr of Object.keys(sourcesMem)) {
    const source = Game.getObjectById(sourceIdStr as Id<Source>);
    if (source instanceof Source && resource.pos.inRangeTo(source.pos, 1)) {
      return true;
    }
  }
  return false;
}

function findDroppedEnergyNearSources(creep: Creep): Resource | null {
  const sourcesMem = creep.room.memory.sources;
  if (!sourcesMem) {
    return null;
  }
  const drops = creep.room.find(FIND_DROPPED_RESOURCES, {
    filter: (r): r is Resource =>
      r.resourceType === RESOURCE_ENERGY && r.amount > 0,
  });
  let best: Resource | null = null;
  let bestRange = Infinity;
  for (const r of drops) {
    let nearSource = false;
    for (const sourceIdStr of Object.keys(sourcesMem)) {
      const source = Game.getObjectById(sourceIdStr as Id<Source>);
      if (source instanceof Source && r.pos.inRangeTo(source.pos, 1)) {
        nearSource = true;
        break;
      }
    }
    if (!nearSource) {
      continue;
    }
    const range = creep.pos.getRangeTo(r.pos);
    if (range < bestRange) {
      bestRange = range;
      best = r;
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
    | StructureExtension
    | StructureTower
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
 * Adjacent-only withdraw or pickup for work-state top-up. Does not use
 * `creep.memory.targetId` (builders cache construction sites there). Never harvest.
 *
 * @returns true if a withdraw or pickup was attempted this tick (including when the
 *   engine returns a non-OK code after enqueueing an intent).
 */
export function tryAdjacentWorkStateEnergyTopUp(creep: Creep): boolean {
  const need = creep.store.getFreeCapacity(RESOURCE_ENERGY);
  if (need <= 0) {
    return false;
  }
  const sourcesMem = creep.room.memory.sources;
  if (!sourcesMem) {
    return false;
  }
  for (const sourceIdStr of Object.keys(sourcesMem)) {
    const sourceId = sourceIdStr as Id<Source>;
    const entry = sourcesMem[sourceId];
    if (!entry?.containerId) {
      continue;
    }
    const container = Game.getObjectById(entry.containerId);
    if (
      !(container instanceof StructureContainer) ||
      !creep.pos.inRangeTo(container.pos, 1) ||
      container.store[RESOURCE_ENERGY] <= 0
    ) {
      continue;
    }
    const result = creep.withdraw(container, RESOURCE_ENERGY);
    log.path(`${creep.name} branch=work_topup_withdraw_adjacent`);
    log.debugLazy(
      () =>
        `${creep.name} action=withdraw container=${container.id} result=${result} workTopUp`,
    );
    return true;
  }
  const drops = creep.room.find(FIND_DROPPED_RESOURCES, {
    filter: (r): r is Resource =>
      r.resourceType === RESOURCE_ENERGY &&
      r.amount > 0 &&
      creep.pos.inRangeTo(r.pos, 1) &&
      isDroppedEnergyAdjacentToSource(creep, r),
  });
  const dropped = drops[0];
  if (dropped) {
    const result = creep.pickup(dropped);
    log.path(`${creep.name} branch=work_topup_pickup_adjacent`);
    log.debugLazy(
      () =>
        `${creep.name} action=pickup resource=${dropped.id} result=${result} workTopUp`,
    );
    return true;
  }
  return false;
}

/**
 * Adjacent-only withdraw from `RoomMemory.controllerContainerId` for upgrader
 * work-state top-up. Does not use `creep.memory.targetId` (upgraders cache the
 * controller there in `upgrade` state).
 *
 * With `upgradeController`, both sit in pipeline 3: when the carry snapshot has
 * enough energy for all scheduled pipeline-3 intents, they can all execute; only
 * on shortage does the rightmost win over more-left intents (see
 * `docs/agent-references/screeps-api.md` and Simultaneous actions docs).
 *
 * @returns true if a withdraw was attempted this tick.
 */
export function tryAdjacentControllerContainerTopUp(creep: Creep): boolean {
  const need = creep.store.getFreeCapacity(RESOURCE_ENERGY);
  if (need <= 0) {
    return false;
  }
  const raw = getObjectByIdOrNull<StructureContainer>(
    creep.room.memory.controllerContainerId,
  );
  if (
    !(raw instanceof StructureContainer) ||
    !creep.pos.inRangeTo(raw.pos, 1) ||
    raw.store[RESOURCE_ENERGY] <= 0
  ) {
    return false;
  }
  const result = creep.withdraw(raw, RESOURCE_ENERGY);
  log.path(`${creep.name} branch=upgrader_controller_container_topup`);
  log.debugLazy(
    () =>
      `${creep.name} action=withdraw container=${raw.id} result=${result} controllerTopUp`,
  );
  return true;
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
