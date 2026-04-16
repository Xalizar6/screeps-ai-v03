/**
 * Shared FSM utilities for role modules. Pure functions only — no prototype extensions.
 * Transition decisions stay in each role file; this module holds guards and ID resolution.
 */

/** Allowed FSM state names across roles; mirrors `CreepMemory["state"]`. */
export type RoleFsmState = NonNullable<CreepMemory["state"]>;

export function isStoreEmpty(
  creep: Creep,
  resource: ResourceConstant = RESOURCE_ENERGY,
): boolean {
  return creep.store[resource] === 0;
}

export function isStoreFull(
  creep: Creep,
  resource: ResourceConstant = RESOURCE_ENERGY,
): boolean {
  return creep.store.getFreeCapacity(resource) === 0;
}

/**
 * Resolves an id from memory; returns null if missing or stale.
 */
export function getObjectByIdOrNull<T extends _HasId>(
  id: Id<T> | undefined,
): T | null {
  if (id === undefined) {
    return null;
  }
  return Game.getObjectById(id);
}

/**
 * Uses `creep.memory.targetId` when it resolves to an active source; otherwise picks
 * the closest active source by path and caches its id.
 */
export function resolveSource(creep: Creep): Source | null {
  const raw = getObjectByIdOrNull<
    | Source
    | StructureSpawn
    | ConstructionSite
    | StructureController
    | StructureContainer
    | Resource
  >(creep.memory.targetId);
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

export type TransitionStateOptions = {
  /** When true (default), clears `targetId` so the next state picks a fresh target. */
  clearTarget?: boolean;
};

/**
 * Persists next FSM state and tick metadata. Does not run role-specific side effects.
 */
export function transitionState(
  creep: Creep,
  nextState: RoleFsmState,
  options?: TransitionStateOptions,
): void {
  const clearTarget = options?.clearTarget !== false;
  creep.memory.state = nextState;
  creep.memory.stateSinceTick = Game.time;
  if (clearTarget) {
    delete creep.memory.targetId;
  }
}
