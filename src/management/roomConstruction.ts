import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";

export const LOG_MODULE = "roomConstruction" as const;

/** Run source/controller container planning only when `Game.time % this === 0` (see `roomManager`). */
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

/** True if a built container or a container construction site exists within `range` of `center`. */
function hasContainerOrSiteInRange(
  room: Room,
  center: RoomPosition,
  range: number,
): boolean {
  const terrain = room.getTerrain();
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (x < 0 || x > 49 || y < 0 || y > 49) {
        continue;
      }
      const pos = new RoomPosition(x, y, room.name);
      if (pos.roomName !== room.name) {
        continue;
      }
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
  }
  return false;
}

/** True if a container or container site is adjacent to this source (range 1). */
function hasAdjacentContainerOrSite(source: Source): boolean {
  return hasContainerOrSiteInRange(source.room, source.pos, 1);
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

/**
 * Creates a controller-supply container construction site at `pos` (no-op on wall).
 * Uses its own `log.stat` key so controller placement is distinguishable from source containers.
 * @returns `true` only when `createConstructionSite` returns `OK`.
 */
function tryCreateControllerContainerSite(
  room: Room,
  pos: RoomPosition,
): boolean {
  if (room.getTerrain().get(pos.x, pos.y) === TERRAIN_MASK_WALL) {
    return false;
  }
  const code = room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
  if (code === OK) {
    log.stat("controllerContainerSite", `${room.name}@${pos.x},${pos.y}`);
    return true;
  }
  return false;
}

function planContainerNearSource(room: Room, source: Source): void {
  if (hasAdjacentContainerOrSite(source)) {
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

/**
 * Place a controller container ~2 tiles from the controller, biased toward
 * the closest source. We take the 2nd step of the controller->source path so
 * the tile sits on the natural walking corridor and creeps pass through it.
 */
function planContainerNearController(room: Room): void {
  const controller = room.controller;
  if (!controller?.my) {
    return;
  }
  if (
    (room.memory.controllerContainerId &&
      Game.getObjectById(room.memory.controllerContainerId)) ||
    hasContainerOrSiteInRange(room, controller.pos, 2)
  ) {
    return;
  }
  const sources = room.find(FIND_SOURCES);
  if (sources.length === 0) {
    return;
  }
  const closestSource = controller.pos.findClosestByPath(sources);
  if (!closestSource) {
    return;
  }
  const result = PathFinder.search(
    controller.pos,
    { pos: closestSource.pos, range: 1 },
    {
      maxOps: PATHFINDER_MAX_OPS,
      maxRooms: 1,
      plainCost: 2,
      swampCost: 10,
    },
  );
  if (result.incomplete || result.path.length < 2) {
    return;
  }
  const chosen = result.path[1];
  if (!chosen) {
    return;
  }
  tryCreateControllerContainerSite(room, chosen);
}

export function runRoomConstruction(room: Room): void {
  if (!room.controller?.my) {
    return;
  }

  const sources = room.find(FIND_SOURCES);
  for (const source of sources) {
    planContainerNearSource(room, source);
  }
  planContainerNearController(room);
}
