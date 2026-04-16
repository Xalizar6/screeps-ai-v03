import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";

export const LOG_MODULE = "structureCache" as const;

type CachedStructures = {
  tick: number;
  structures: AnyStructure[];
};

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });
const structuresByRoom = new Map<string, CachedStructures>();

function scanStructures(room: Room): AnyStructure[] {
  const structures = room.find(FIND_STRUCTURES);
  structuresByRoom.set(room.name, { tick: Game.time, structures });
  return structures;
}

function getCachedStructures(room: Room): AnyStructure[] {
  const cached = structuresByRoom.get(room.name);
  if (cached?.tick === Game.time) {
    return cached.structures;
  }
  return scanStructures(room);
}

function isOwnedEnergyStructure(
  structure: AnyStructure,
): structure is StructureSpawn | StructureExtension | StructureTower {
  if (
    structure.structureType !== STRUCTURE_SPAWN &&
    structure.structureType !== STRUCTURE_EXTENSION &&
    structure.structureType !== STRUCTURE_TOWER
  ) {
    return false;
  }
  return "my" in structure && structure.my;
}

export function runStructureCache(room: Room): void {
  const structures = scanStructures(room);
  log.debugLazy(
    () => `room=${room.name} action=scan_structures count=${structures.length}`,
  );
}

export function getStructures(room: Room): AnyStructure[] {
  return getCachedStructures(room);
}

export function getUnfilledEnergyStructures(room: Room): AnyStoreStructure[] {
  const structures = getCachedStructures(room);
  const fillable: AnyStoreStructure[] = [];
  for (const structure of structures) {
    if (!isOwnedEnergyStructure(structure)) {
      continue;
    }
    if (structure.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
      continue;
    }
    fillable.push(structure);
  }
  return fillable;
}
