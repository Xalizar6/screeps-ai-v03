/**
 * Shared FSM utilities for role modules. Pure functions only — no prototype extensions.
 * Transition decisions stay in each role file; this module holds guards and ID resolution.
 */

import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";

export const LOG_MODULE = "fsm" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

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
    | StructureExtension
    | StructureTower
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
 * Emits a `path`-level log line under the `fsm` module so transitions are observable
 * even when the originating role's per-state branches return without logging.
 */
export function transitionState(
  creep: Creep,
  nextState: RoleFsmState,
  options?: TransitionStateOptions,
): void {
  const clearTarget = options?.clearTarget !== false;
  const prevState = creep.memory.state ?? "none";
  creep.memory.state = nextState;
  creep.memory.stateSinceTick = Game.time;
  if (clearTarget) {
    delete creep.memory.targetId;
  }
  log.path(
    `${creep.name} role=${creep.memory.role ?? "unknown"} state=${prevState}->${nextState}`,
  );
}

/**
 * Runs the role dispatcher up to `maxPasses` times in one tick whenever
 * `creep.memory.state` changes during a pass (for example after `transitionState`).
 * Without a second pass, handlers that transition then `return` would idle until the
 * next tick before issuing `moveTo` toward the new state's target.
 *
 * Screeps allows one intent per action *type* per tick; movement is a separate type from
 * harvest/transfer/build/etc. A follow-up pass therefore often still does useful work
 * (typically `moveTo`). See https://docs.screeps.com/api/
 *
 * @param creep - Creep whose `memory.state` the dispatcher reads and handlers update.
 * @param dispatch - Role callback: normalize state (e.g. `ensureState`), then run the
 *   handler for that state. Must establish a valid `memory.state` when it was missing.
 * @param maxPasses - Caps iterations (default 2: initial pass plus one re-run after a
 *   transition). Prevents unbounded loops if state were to flip repeatedly in one tick.
 */
export function runFsm(
  creep: Creep,
  dispatch: () => void,
  maxPasses: number = 2,
): void {
  for (let i = 0; i < maxPasses; i++) {
    const before = creep.memory.state;
    dispatch();
    if (creep.memory.state === before) {
      return;
    }
  }
}
