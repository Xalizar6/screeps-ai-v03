import { countBodyParts } from "./shuttleDemand";

/** Per-room creep lists and aggregates built in one `Game.creeps` pass per tick. */
export interface RoomCreepBuckets {
  harvesters: Creep[];
  shuttles: Creep[];
  /** Shuttles in this room that are not spawning (e.g. spawn demand). Harvester gating uses {@link getShuttleCreepCountInRoom}. */
  shuttlesActive: number;
  upgraders: Creep[];
  /** Sum of `WORK` parts on upgraders in this room (for shuttle demand). */
  upgraderWorkParts: number;
  builders: Creep[];
  repairers: Creep[];
}

/** Single-tick snapshot: per-room buckets for spawn and role passes (bucketed by `creep.room.name`). */
export interface CreepSnapshot {
  tick: number;
  byRoom: Partial<Record<string, RoomCreepBuckets>>;
  totalCreepCount: number;
}

let snapshotForTick: CreepSnapshot | null = null;

/** Returns an empty bucket for lazy room insertion when a room has no bucket yet. */
function emptyRoomBucket(): RoomCreepBuckets {
  return {
    harvesters: [],
    shuttles: [],
    shuttlesActive: 0,
    upgraders: [],
    upgraderWorkParts: 0,
    builders: [],
    repairers: [],
  };
}

/**
 * Builds a fresh snapshot from `Game.creeps` in one linear pass.
 * @returns Snapshot for the current `Game.time`
 */
export function buildCreepSnapshot(): CreepSnapshot {
  const byRoom: Partial<Record<string, RoomCreepBuckets>> = {};
  let totalCreepCount = 0;

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (!creep) {
      continue;
    }
    totalCreepCount += 1;
    const role = creep.memory.role;
    const roomName = creep.room.name;
    let bucket = byRoom[roomName];
    if (!bucket) {
      bucket = emptyRoomBucket();
      byRoom[roomName] = bucket;
    }

    if (role === "harvester") {
      bucket.harvesters.push(creep);
    } else if (role === "shuttle") {
      bucket.shuttles.push(creep);
      if (!creep.spawning) {
        bucket.shuttlesActive += 1;
      }
    } else if (role === "upgrader") {
      bucket.upgraders.push(creep);
      bucket.upgraderWorkParts += countBodyParts(creep.body, WORK);
    } else if (role === "builder") {
      bucket.builders.push(creep);
    } else if (role === "repairer") {
      bucket.repairers.push(creep);
    }
  }

  const snap: CreepSnapshot = {
    tick: Game.time,
    byRoom,
    totalCreepCount,
  };
  snapshotForTick = snap;
  return snap;
}

/**
 * Active shuttle count in a room from the last `buildCreepSnapshot()` (non-spawning only).
 * @param roomName Room to query
 */
export function getActiveShuttleCountInRoom(roomName: string): number {
  return snapshotForTick?.byRoom[roomName]?.shuttlesActive ?? 0;
}

/**
 * Shuttle creeps in a room from the last `buildCreepSnapshot()` (includes `creep.spawning`).
 * Use for harvester fallback gating so a shuttle on the pad still counts as logistics present.
 * For “can act this tick” use {@link getActiveShuttleCountInRoom} / `shuttlesActive`.
 */
export function getShuttleCreepCountInRoom(roomName: string): number {
  return snapshotForTick?.byRoom[roomName]?.shuttles.length ?? 0;
}

/**
 * Room bucket for spawn logic; missing rooms get a fresh empty bucket (not shared).
 * @param roomName Room name
 * @param snap Tick snapshot (must be the same object returned by `buildCreepSnapshot()` this tick)
 */
export function getRoomCreepBucket(
  roomName: string,
  snap: CreepSnapshot,
): RoomCreepBuckets {
  const existing = snap.byRoom[roomName];
  if (existing) {
    return existing;
  }
  return emptyRoomBucket();
}
