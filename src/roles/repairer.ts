import {
  countRepairBacklog,
  getRepairTypePriority,
  isRepairCandidateType,
} from "../management/repairConfig";
import { getStructures } from "../management/structureCache";
import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import {
  acquireEnergy,
  tryAdjacentWorkStateEnergyTopUp,
} from "./energyAcquisition";
import {
  isEnergyBelowWorkTopUpThreshold,
  isStoreEmpty,
  isStoreFull,
  runFsm,
  transitionState,
} from "./fsm";

export const LOG_MODULE = "repairer" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

type RepairerState = "harvest" | "repair";

function ensureState(creep: Creep): RepairerState {
  if (creep.memory.state !== "harvest" && creep.memory.state !== "repair") {
    creep.memory.state = "harvest";
    creep.memory.stateSinceTick = Game.time;
  }
  return creep.memory.state === "repair" ? "repair" : "harvest";
}

/** True if this creep has an in-progress job (hits < 95%) or the room has backlog (hits < 50%). */
function hasRepairWork(creep: Creep): boolean {
  const id = creep.memory.repairTargetId;
  if (id) {
    const raw = Game.getObjectById(id);
    if (
      raw instanceof Structure &&
      raw.room.name === creep.room.name &&
      isRepairCandidateType(raw.structureType) &&
      raw.hits < raw.hitsMax * 0.95
    ) {
      return true;
    }
  }
  return countRepairBacklog(creep.room) > 0;
}

function resolveRepairTarget(creep: Creep): Structure | null {
  if (creep.memory.repairTargetId) {
    const raw = Game.getObjectById(creep.memory.repairTargetId);
    if (
      raw instanceof Structure &&
      raw.room.name === creep.room.name &&
      isRepairCandidateType(raw.structureType)
    ) {
      if (raw.hits < raw.hitsMax * 0.95) {
        return raw;
      }
      delete creep.memory.repairTargetId;
    } else if (raw) {
      delete creep.memory.repairTargetId;
    }
  }

  let best: Structure | null = null;
  let bestPriority = Infinity;
  let bestRange = Infinity;
  for (const structure of getStructures(creep.room)) {
    if (
      !isRepairCandidateType(structure.structureType) ||
      structure.hits >= structure.hitsMax * 0.5
    ) {
      continue;
    }
    const p = getRepairTypePriority(structure.structureType);
    const r = creep.pos.getRangeTo(structure.pos);
    if (
      best === null ||
      p < bestPriority ||
      (p === bestPriority && r < bestRange)
    ) {
      best = structure;
      bestPriority = p;
      bestRange = r;
    }
  }
  if (!best) {
    return null;
  }
  creep.memory.repairTargetId = best.id;
  return best;
}

function runHarvest(creep: Creep): void {
  if (isStoreFull(creep)) {
    transitionState(creep, "repair");
    return;
  }
  acquireEnergy(creep);
}

function runRepair(creep: Creep): void {
  if (
    isEnergyBelowWorkTopUpThreshold(creep) &&
    !tryAdjacentWorkStateEnergyTopUp(creep) &&
    isStoreEmpty(creep)
  ) {
    transitionState(creep, "harvest");
    return;
  }
  const target = resolveRepairTarget(creep);
  if (!target) {
    log.path(`${creep.name} branch=no_repair_target`);
    return;
  }
  log.path(`${creep.name} branch=repair`);
  log.debugLazy(
    () =>
      `${creep.name} energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()} structure=${target.id}`,
  );
  const result = creep.repair(target);
  log.debugLazy(
    () => `${creep.name} action=repair structure=${target.id} result=${result}`,
  );
  if (result === ERR_NOT_IN_RANGE) {
    const move = creep.moveTo(target);
    log.path(`${creep.name} branch=repair_not_in_range`);
    log.debugLazy(
      () => `${creep.name} action=moveTo structure=${target.id} result=${move}`,
    );
  }
}

/** Main loop entry: acquire energy or repair structures, with same-tick re-dispatch after FSM transitions. */
export const runRepairer = (creep: Creep): void => {
  if (!hasRepairWork(creep)) {
    log.path(`${creep.name} branch=suicide_no_repair_work`);
    creep.suicide();
    return;
  }

  runFsm(creep, () => {
    const state = ensureState(creep);
    if (state === "repair") {
      runRepair(creep);
    } else {
      runHarvest(creep);
    }
  });
};
