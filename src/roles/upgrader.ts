import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import { acquireEnergy } from "./energyAcquisition";
import { isStoreEmpty, isStoreFull, runFsm, transitionState } from "./fsm";

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

function runHarvest(creep: Creep): void {
  if (isStoreFull(creep)) {
    transitionState(creep, "upgrade");
    return;
  }
  acquireEnergy(creep);
}

function runUpgrade(creep: Creep): void {
  if (isStoreEmpty(creep)) {
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
