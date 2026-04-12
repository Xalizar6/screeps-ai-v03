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
