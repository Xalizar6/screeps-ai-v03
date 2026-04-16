import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import { CONSTRUCTION_PLAN_INTERVAL } from "./roomConstruction";

export const LOG_MODULE = "roomCache" as const;

/** Re-scan for containers near sources when missing; aligned with construction cadence. */
export const CONTAINER_RESCAN_INTERVAL = CONSTRUCTION_PLAN_INTERVAL;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

function pickContainerNearSource(
  source: Source,
): StructureContainer | undefined {
  const structures = source.pos.findInRange(FIND_STRUCTURES, 2, {
    filter: (s): s is StructureContainer =>
      s.structureType === STRUCTURE_CONTAINER,
  });
  if (structures.length === 0) {
    return undefined;
  }
  structures.sort(
    (a, b) => source.pos.getRangeTo(a.pos) - source.pos.getRangeTo(b.pos),
  );
  return structures[0];
}

function scanAndSetContainer(
  room: Room,
  sourceId: Id<Source>,
  entry: SourceMemory,
): void {
  const source = Game.getObjectById(sourceId);
  if (!(source instanceof Source) || source.room.name !== room.name) {
    return;
  }
  const container = pickContainerNearSource(source);
  if (container) {
    entry.containerId = container.id;
    log.debugLazy(
      () =>
        `room=${room.name} source=${sourceId} container=${container.id} branch=scan_found`,
    );
  }
}

/**
 * Initializes and maintains `room.memory.sources` (source IDs and nearby container IDs).
 * Call once per room per tick from `roomManager`.
 */
export function runRoomCache(room: Room): void {
  if (!room.controller?.my) {
    return;
  }

  if (!room.memory.sources) {
    room.memory.sources = {};
    const sources = room.find(FIND_SOURCES);
    for (const source of sources) {
      room.memory.sources[source.id] = {};
      scanAndSetContainer(room, source.id, room.memory.sources[source.id]!);
    }
    log.debugLazy(
      () => `room=${room.name} branch=init_sources count=${sources.length}`,
    );
    return;
  }

  const sourcesMem = room.memory.sources;
  const rescanDue = Game.time % CONTAINER_RESCAN_INTERVAL === 0;

  for (const sourceIdStr in sourcesMem) {
    const sourceId = sourceIdStr as Id<Source>;
    const entry = sourcesMem[sourceId];
    if (!entry) {
      continue;
    }

    if (entry.containerId) {
      const container = Game.getObjectById(entry.containerId);
      if (!container) {
        delete entry.containerId;
        log.debugLazy(
          () => `room=${room.name} source=${sourceId} branch=container_gone`,
        );
      }
    }

    if (!entry.containerId && rescanDue) {
      scanAndSetContainer(room, sourceId, entry);
    }
  }
}
