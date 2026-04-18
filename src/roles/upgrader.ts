import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import {
  acquireEnergy,
  tryAdjacentControllerContainerTopUp,
} from "./energyAcquisition";
import {
  getObjectByIdOrNull,
  isEnergyBelowWorkTopUpThreshold,
  isStoreEmpty,
  isStoreFull,
  runFsm,
  transitionState,
} from "./fsm";

export const LOG_MODULE = "upgrader" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

type UpgraderState = "harvest" | "upgrade";

function ensureState(creep: Creep): UpgraderState {
  if (creep.memory.state !== "harvest" && creep.memory.state !== "upgrade") {
    creep.memory.state = "harvest";
    creep.memory.stateSinceTick = Game.time;
  }
  return creep.memory.state === "upgrade" ? "upgrade" : "harvest";
}

/**
 * Resolves the room-cached controller-adjacent container when it exists and holds energy.
 * Uses `RoomMemory.controllerContainerId` (maintained by `roomCache`) so upgraders avoid repeated `find` scans.
 */
function resolveViableControllerContainer(
  room: Room,
): StructureContainer | null {
  const id = room.memory.controllerContainerId;
  if (!id) {
    return null;
  }
  const raw = getObjectByIdOrNull(id);
  if (!(raw instanceof StructureContainer)) {
    return null;
  }
  if (raw.store[RESOURCE_ENERGY] <= 0) {
    return null;
  }
  return raw;
}

function resolveController(creep: Creep): StructureController | null {
  const raw = creep.memory.targetId
    ? Game.getObjectById(creep.memory.targetId)
    : null;
  if (raw instanceof StructureController && raw.my) {
    return raw;
  }
  if (raw) {
    delete creep.memory.targetId;
  }
  const controller = creep.room.controller;
  if (controller?.my) {
    creep.memory.targetId = controller.id;
    return controller;
  }
  return null;
}

/**
 * Refills the creep: prefer withdraw from `RoomMemory.controllerContainerId` when viable, else `acquireEnergy`.
 * @remarks Does not gate FSM transitions on `creep.store` after `withdraw`; `isStoreFull` runs at handler entry only.
 */
function runHarvest(creep: Creep): void {
  if (isStoreFull(creep)) {
    transitionState(creep, "upgrade");
    return;
  }
  const controllerContainer = resolveViableControllerContainer(creep.room);
  if (!controllerContainer) {
    const cachedCcId = creep.room.memory.controllerContainerId;
    if (cachedCcId && creep.memory.targetId === cachedCcId) {
      delete creep.memory.targetId;
    }
    acquireEnergy(creep);
    return;
  }
  creep.memory.targetId = controllerContainer.id;
  log.path(`${creep.name} branch=withdraw_controller_container`);
  const result = creep.withdraw(controllerContainer, RESOURCE_ENERGY);
  log.debugLazy(
    () =>
      `${creep.name} action=withdraw container=${controllerContainer.id} result=${result}`,
  );
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(controllerContainer);
    log.path(`${creep.name} branch=controller_container_not_in_range`);
    return;
  }
  if (result === ERR_NOT_ENOUGH_RESOURCES || result === ERR_INVALID_TARGET) {
    delete creep.memory.targetId;
    acquireEnergy(creep);
    return;
  }
}

/** Upgrades the controller; when carry is low, attempts adjacent controller-container withdraw then upgrade (pipeline 3). */
function runUpgrade(creep: Creep): void {
  if (
    isEnergyBelowWorkTopUpThreshold(creep) &&
    !tryAdjacentControllerContainerTopUp(creep) &&
    isStoreEmpty(creep)
  ) {
    transitionState(creep, "harvest");
    return;
  }
  const controller = resolveController(creep);
  if (!controller) {
    log.path(`${creep.name} branch=no_my_controller`);
    return;
  }
  log.path(`${creep.name} branch=upgrade`);
  log.debugLazy(
    () =>
      `${creep.name} energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()} controller=${controller.id}`,
  );
  const result = creep.upgradeController(controller);
  log.debugLazy(
    () =>
      `${creep.name} action=upgradeController controller=${controller.id} result=${result}`,
  );
  if (result === ERR_NOT_IN_RANGE) {
    const move = creep.moveTo(controller);
    log.path(`${creep.name} branch=upgrade_not_in_range`);
    log.debugLazy(
      () =>
        `${creep.name} action=moveTo controller=${controller.id} result=${move}`,
    );
  }
}

/** Main loop entry: acquire energy or upgrade the controller, with same-tick re-dispatch after FSM transitions. */
export const runUpgrader = (creep: Creep): void => {
  runFsm(creep, () => {
    const state = ensureState(creep);
    if (state === "upgrade") {
      runUpgrade(creep);
    } else {
      runHarvest(creep);
    }
  });
};
