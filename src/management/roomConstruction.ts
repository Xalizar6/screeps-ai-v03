import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";

export const LOG_MODULE = "roomConstruction" as const;

/** Run source container planning only when `Game.time % this === 0` (see `roomManager`). */
export const CONSTRUCTION_PLAN_INTERVAL = 100;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

const PATHFINDER_MAX_OPS = 4000;

/** Deterministic order: nested dx, then dy (same as fallback scan). */
function adjacentPositions(sourcePos: RoomPosition): RoomPosition[] {
  const out: RoomPosition[] = [];
  const { roomName } = sourcePos;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const x = sourcePos.x + dx;
      const y = sourcePos.y + dy;
      if (x < 0 || x > 49 || y < 0 || y > 49) {
        continue;
      }
      out.push(new RoomPosition(x, y, roomName));
    }
  }
  return out;
}

function hasAdjacentContainerIntent(source: Source): boolean {
  const terrain = source.room.getTerrain();
  for (const pos of adjacentPositions(source.pos)) {
    if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
      continue;
    }
    for (const s of pos.lookFor(LOOK_STRUCTURES)) {
      if (s.structureType === STRUCTURE_CONTAINER) {
        return true;
      }
    }
    for (const site of pos.lookFor(LOOK_CONSTRUCTION_SITES)) {
      if (site.structureType === STRUCTURE_CONTAINER) {
        return true;
      }
    }
  }
  return false;
}

function pickAdjacentFromPath(
  controller: StructureController,
  source: Source,
): RoomPosition | null {
  const result = PathFinder.search(
    controller.pos,
    { pos: source.pos, range: 1 },
    {
      maxOps: PATHFINDER_MAX_OPS,
      maxRooms: 1,
      plainCost: 2,
      swampCost: 10,
    },
  );
  if (result.incomplete || result.path.length === 0) {
    return null;
  }
  const last = result.path[result.path.length - 1];
  if (
    last === undefined ||
    last.roomName !== source.room.name ||
    last.getRangeTo(source.pos) !== 1
  ) {
    return null;
  }
  return last;
}

function tryCreateContainerSite(room: Room, pos: RoomPosition): boolean {
  if (room.getTerrain().get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
    return false;
  }
  const code = room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
  if (code === OK) {
    log.stat("containerSite", `${room.name}@${pos.x},${pos.y}`);
    return true;
  }
  return false;
}

function planContainerNearSource(room: Room, source: Source): void {
  if (hasAdjacentContainerIntent(source)) {
    return;
  }

  const controller = room.controller;
  let chosen: RoomPosition | null = null;
  if (controller?.my) {
    chosen = pickAdjacentFromPath(controller, source);
  }

  if (chosen && tryCreateContainerSite(room, chosen)) {
    return;
  }

  const terrain = room.getTerrain();
  for (const pos of adjacentPositions(source.pos)) {
    if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
      continue;
    }
    if (tryCreateContainerSite(room, pos)) {
      return;
    }
  }
}

export function runRoomConstruction(room: Room): void {
  if (!room.controller?.my) {
    return;
  }

  const sources = room.find(FIND_SOURCES);
  for (const source of sources) {
    planContainerNearSource(room, source);
  }
}
