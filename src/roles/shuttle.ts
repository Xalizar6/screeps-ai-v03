import { DEFAULT_SHUTTLE_PROFILE_ID } from "../management/shuttleDemand";
import { getUnfilledEnergyStructures } from "../management/structureCache";
import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import { acquireEnergy } from "./energyAcquisition";
import {
  getObjectByIdOrNull,
  isStoreEmpty,
  isStoreFull,
  runFsm,
  transitionState,
} from "./fsm";

export const LOG_MODULE = "shuttle" as const;

const log = createLogger(LOG_MODULE, {
  defaultLevel: LogLevel.Information,
  group: "roles",
});
const DELIVERY_PRIORITY: readonly StructureConstant[] = [
  STRUCTURE_SPAWN,
  STRUCTURE_EXTENSION,
  STRUCTURE_TOWER,
];
type DeliveryTarget =
  | StructureSpawn
  | StructureExtension
  | StructureTower
  | StructureContainer;

type ShuttleState = "harvest" | "deliver" | "deliverController";

const SHUTTLE_STATES: ReadonlySet<ShuttleState> = new Set([
  "harvest",
  "deliver",
  "deliverController",
]);

/**
 * Ensures shuttle FSM state and profile metadata are valid for this role.
 * @remarks Does not touch `creep.store`; safe at handler entry for intent timing.
 */
function ensureState(creep: Creep): ShuttleState {
  if (
    creep.memory.role === "shuttle" &&
    creep.memory.shuttleProfileId === undefined
  ) {
    creep.memory.shuttleProfileId = DEFAULT_SHUTTLE_PROFILE_ID;
  }
  if (!SHUTTLE_STATES.has(creep.memory.state as ShuttleState)) {
    creep.memory.state = "harvest";
    creep.memory.stateSinceTick = Game.time;
  }
  const s = creep.memory.state as ShuttleState;
  return s === "deliver" || s === "deliverController" ? s : "harvest";
}

function isDeliveryTarget(
  structure: AnyStructure,
): structure is DeliveryTarget {
  return (
    structure.structureType === STRUCTURE_SPAWN ||
    structure.structureType === STRUCTURE_EXTENSION ||
    structure.structureType === STRUCTURE_TOWER
  );
}

/**
 * Returns true when spawn, extensions, or towers still accept energy (shuttle must serve these first).
 * @param room Room to inspect (uses same-tick structure cache)
 */
function hasPriorityInfrastructureDemand(room: Room): boolean {
  const unfilled = getUnfilledEnergyStructures(room);
  return unfilled.length > 0;
}

function resolveControllerContainer(room: Room): StructureContainer | null {
  const id = room.memory.controllerContainerId;
  if (!id) {
    return null;
  }
  const container = Game.getObjectById(id);
  if (!(container instanceof StructureContainer)) {
    return null;
  }
  if (container.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
    return null;
  }
  return container;
}

function resolveDeliveryTarget(creep: Creep): DeliveryTarget | null {
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
  if (
    (raw instanceof StructureSpawn ||
      raw instanceof StructureExtension ||
      raw instanceof StructureTower) &&
    raw.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  ) {
    return raw;
  }
  const controllerContainerId = creep.room.memory.controllerContainerId;
  if (
    raw instanceof StructureContainer &&
    controllerContainerId &&
    raw.id === controllerContainerId &&
    raw.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  ) {
    return raw;
  }
  if (raw) {
    delete creep.memory.targetId;
  }

  const unfilled = getUnfilledEnergyStructures(creep.room);
  for (const structureType of DELIVERY_PRIORITY) {
    let closest: DeliveryTarget | null = null;
    let bestRange = Infinity;
    for (const structure of unfilled) {
      if (
        !isDeliveryTarget(structure) ||
        structure.structureType !== structureType
      ) {
        continue;
      }
      const range = creep.pos.getRangeTo(structure.pos);
      if (range < bestRange) {
        bestRange = range;
        closest = structure;
      }
    }
    if (closest) {
      creep.memory.targetId = closest.id;
      return closest;
    }
  }

  const controllerContainer = resolveControllerContainer(creep.room);
  if (controllerContainer) {
    creep.memory.targetId = controllerContainer.id;
    return controllerContainer;
  }

  return null;
}

/**
 * Resolves the controller buffer container for delivery-only state (no spawn/extension/tower pass).
 * Target is `RoomMemory.controllerContainerId` (see `roomConstruction` / `roomCache`).
 */
function resolveControllerDeliveryTarget(
  creep: Creep,
): StructureContainer | null {
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
  const controllerContainerId = creep.room.memory.controllerContainerId;
  if (
    raw instanceof StructureContainer &&
    controllerContainerId &&
    raw.id === controllerContainerId &&
    raw.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  ) {
    return raw;
  }
  if (raw) {
    delete creep.memory.targetId;
  }
  const container = resolveControllerContainer(creep.room);
  if (container) {
    creep.memory.targetId = container.id;
    return container;
  }
  return null;
}

/**
 * Picks harvest vs delivery state after the creep is full; prefers controller-only delivery when no higher-priority sinks need energy.
 * @remarks Uses only handler-entry `isStoreFull`; no post-withdraw same-tick store checks.
 */
function transitionFromFullStore(creep: Creep): void {
  const controller = resolveControllerContainer(creep.room);
  if (!hasPriorityInfrastructureDemand(creep.room) && controller) {
    transitionState(creep, "deliverController");
    return;
  }
  transitionState(creep, "deliver");
}

function runHarvest(creep: Creep): void {
  if (isStoreFull(creep)) {
    transitionFromFullStore(creep);
    return;
  }
  acquireEnergy(creep);
}

function runDeliver(creep: Creep): void {
  if (isStoreEmpty(creep)) {
    transitionState(creep, "harvest");
    return;
  }
  if (hasPriorityInfrastructureDemand(creep.room) === false) {
    const controller = resolveControllerContainer(creep.room);
    if (controller) {
      transitionState(creep, "deliverController");
      return;
    }
  }
  log.path(`${creep.name} branch=deliver`);
  const target = resolveDeliveryTarget(creep);
  if (!target) {
    log.path(`${creep.name} branch=deliver_no_target`);
    return;
  }
  const result = creep.transfer(target, RESOURCE_ENERGY);
  log.debugLazy(
    () =>
      `${creep.name} action=transfer target=${target.id} type=${target.structureType} result=${result}`,
  );
  if (result === ERR_NOT_IN_RANGE) {
    const move = creep.moveTo(target);
    log.path(`${creep.name} branch=deliver_not_in_range`);
    log.debugLazy(
      () => `${creep.name} action=moveTo target=${target.id} result=${move}`,
    );
  }
}

/**
 * Delivers only to the controller buffer container (`controllerContainerId`); pivots to `deliver` if spawn/extensions/towers need energy.
 * @remarks Transfer return codes do not gate FSM transitions; empty/full checks run at handler entry only.
 */
function runDeliverController(creep: Creep): void {
  if (isStoreEmpty(creep)) {
    transitionState(creep, "harvest");
    return;
  }
  if (hasPriorityInfrastructureDemand(creep.room)) {
    transitionState(creep, "deliver");
    return;
  }
  log.path(`${creep.name} branch=deliver_controller`);
  const target = resolveControllerDeliveryTarget(creep);
  if (!target) {
    log.path(`${creep.name} branch=deliver_controller_no_target`);
    transitionState(creep, "harvest");
    return;
  }
  const result = creep.transfer(target, RESOURCE_ENERGY);
  log.debugLazy(
    () =>
      `${creep.name} action=transfer target=${target.id} type=controller_container result=${result}`,
  );
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(target);
    log.path(`${creep.name} branch=deliver_controller_not_in_range`);
  }
}

/** Main loop entry: acquire energy or deliver to structures, with same-tick re-dispatch after FSM transitions. */
export const runShuttle = (creep: Creep): void => {
  runFsm(creep, () => {
    const state = ensureState(creep);
    if (state === "deliver") {
      runDeliver(creep);
    } else if (state === "deliverController") {
      runDeliverController(creep);
    } else {
      runHarvest(creep);
    }
  });
};
