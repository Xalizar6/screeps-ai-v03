import { getUnfilledEnergyStructures } from "../management/structureCache";
import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import { acquireEnergy } from "./energyAcquisition";
import {
  getObjectByIdOrNull,
  isStoreEmpty,
  isStoreFull,
  transitionState,
} from "./fsm";

export const LOG_MODULE = "shuttle" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });
const DELIVERY_PRIORITY: readonly StructureConstant[] = [
  STRUCTURE_SPAWN,
  STRUCTURE_EXTENSION,
  STRUCTURE_TOWER,
];
type DeliveryTarget = StructureSpawn | StructureExtension | StructureTower;

type ShuttleState = "harvest" | "deliver";

function ensureState(creep: Creep): ShuttleState {
  if (creep.memory.state !== "harvest" && creep.memory.state !== "deliver") {
    creep.memory.state = "harvest";
    creep.memory.stateSinceTick = Game.time;
  }
  return creep.memory.state === "deliver" ? "deliver" : "harvest";
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
    raw &&
    (raw instanceof StructureSpawn ||
      raw instanceof StructureExtension ||
      raw instanceof StructureTower) &&
    raw.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  ) {
    return raw;
  }
  if (raw) {
    delete creep.memory.targetId;
  }

  const unfilled = getUnfilledEnergyStructures(creep.room);
  for (const structureType of DELIVERY_PRIORITY) {
    const tier: DeliveryTarget[] = [];
    for (const structure of unfilled) {
      if (
        isDeliveryTarget(structure) &&
        structure.structureType === structureType
      ) {
        tier.push(structure);
      }
    }
    if (tier.length === 0) {
      continue;
    }
    const closest = creep.pos.findClosestByPath(tier);
    if (closest) {
      creep.memory.targetId = closest.id;
      return closest;
    }
  }

  return null;
}

function runHarvest(creep: Creep): void {
  if (isStoreFull(creep)) {
    transitionState(creep, "deliver");
    return;
  }
  acquireEnergy(creep);
}

function runDeliver(creep: Creep): void {
  if (isStoreEmpty(creep)) {
    transitionState(creep, "harvest");
    return;
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

export const runShuttle = (creep: Creep): void => {
  const state = ensureState(creep);
  if (state === "deliver") {
    runDeliver(creep);
  } else {
    runHarvest(creep);
  }
};
