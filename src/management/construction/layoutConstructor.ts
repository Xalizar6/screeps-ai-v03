import { createLogger } from "../../logging/logger";
import { LogLevel } from "../../logging/levels";
import { MIN_BUCKET_FOR_CONSTRUCTION_PLAN } from "../roomConstruction";

export const LOG_MODULE = "layoutConstructor" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

/**
 * @returns Whether the controller level allows building planned items tagged with `planRcl` (`0` = always).
 */
function isPlanRclUnlocked(room: Room, planRcl: number): boolean {
  const level = room.controller?.level ?? 0;
  if (planRcl === 0) {
    return true;
  }
  return level >= planRcl;
}

/**
 * @returns True when `structureType` already exists or has a pending construction site at `pos`.
 * Uses `pos.lookFor` which scopes to the position's room without a separate `room` reference.
 */
function positionHasStructureOrSite(
  pos: RoomPosition,
  structureType: BuildableStructureConstant,
): boolean {
  for (const st of pos.lookFor(LOOK_STRUCTURES)) {
    if (st.structureType === structureType) {
      return true;
    }
  }
  for (const site of pos.lookFor(LOOK_CONSTRUCTION_SITES)) {
    if (site.structureType === structureType) {
      return true;
    }
  }
  return false;
}

/**
 * Places construction sites from `RoomMemory.layoutPlan` when the player set `layoutApproved` and the bucket allows heavy work.
 * Call only on the same cadence as `runRoomConstruction` (see `CONSTRUCTION_PLAN_INTERVAL` in `roomManager`).
 * @param room Owned room with an optional stored layout plan.
 * @remarks Mutates the game world via `createConstructionSite`; respects RCL tags and stops early on `ERR_FULL`.
 */
export function runLayoutConstructor(room: Room): void {
  if (!room.controller?.my) {
    return;
  }
  if (room.memory.layoutApproved !== true) {
    return;
  }
  const plan = room.memory.layoutPlan;
  if (!plan) {
    return;
  }
  if (Game.cpu.bucket < MIN_BUCKET_FOR_CONSTRUCTION_PLAN) {
    log.debugLazy(
      () =>
        `${room.name} layoutConstructor skip bucket=${Game.cpu.bucket} min=${MIN_BUCKET_FOR_CONSTRUCTION_PLAN}`,
    );
    return;
  }

  const terrain = room.getTerrain();

  for (const segment of plan.roads) {
    if (!isPlanRclUnlocked(room, segment.rcl)) {
      continue;
    }
    for (const pair of segment.path) {
      const [x, y] = pair;
      if (x < 0 || x > 49 || y < 0 || y > 49) {
        continue;
      }
      if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
        continue;
      }
      const pos = new RoomPosition(x, y, room.name);
      if (positionHasStructureOrSite(pos, STRUCTURE_ROAD)) {
        continue;
      }
      const code = room.createConstructionSite(x, y, STRUCTURE_ROAD);
      if (code === OK) {
        log.stat("layoutRoadSite", `${room.name}@${x},${y}`);
      } else if (code === ERR_FULL) {
        log.info(`${room.name} layoutConstructor hit global site cap`);
        return;
      } else {
        log.debugLazy(() => `${room.name} road site @${x},${y} code=${code}`);
      }
    }
  }

  for (const s of plan.structures) {
    if (!isPlanRclUnlocked(room, s.rcl)) {
      continue;
    }
    const [x, y] = s.pos;
    if (x < 0 || x > 49 || y < 0 || y > 49) {
      continue;
    }
    if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
      continue;
    }
    const pos = new RoomPosition(x, y, room.name);
    if (positionHasStructureOrSite(pos, s.type)) {
      continue;
    }
    const code = room.createConstructionSite(x, y, s.type);
    if (code === OK) {
      log.stat("layoutStructureSite", `${room.name}@${s.type}@${x},${y}`);
    } else if (code === ERR_FULL) {
      log.info(`${room.name} layoutConstructor hit global site cap`);
      return;
    } else {
      log.debugLazy(
        () => `${room.name} structure site ${s.type}@${x},${y} code=${code}`,
      );
    }
  }
}
