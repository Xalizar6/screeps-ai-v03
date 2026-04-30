import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";

export const LOG_MODULE = "roomConstruction" as const;

/** Run source/controller container planning only when `Game.time % this === 0` (see `roomManager`). */
export const CONSTRUCTION_PLAN_INTERVAL = 100;

/**
 * Chebyshev radius from the controller for buffer container sites and for `roomCache` discovery.
 * Path placement uses step index `CONTROLLER_BUFFER_CONTAINER_RANGE - 1` along PathFinder toward the nearest source.
 */
export const CONTROLLER_BUFFER_CONTAINER_RANGE = 3;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

const PATHFINDER_MAX_OPS = 4000;

/** Defer heavy `PathFinder` / layout construction when the bucket is low (see Screeps CPU bucket docs). */
export const MIN_BUCKET_FOR_CONSTRUCTION_PLAN = 1200;

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
 * Place a controller buffer container ~{@link CONTROLLER_BUFFER_CONTAINER_RANGE} steps along the path from the controller toward the closest source.
 * Reuses `sources` from the caller to avoid a second `FIND_SOURCES`.
 * @param room Owned room
 * @param sources Same array as used for per-source container planning this tick
 */
function planContainerNearController(room: Room, sources: Source[]): void {
  const controller = room.controller;
  if (!controller?.my) {
    return;
  }
  if (
    (room.memory.controllerContainerId &&
      Game.getObjectById(room.memory.controllerContainerId)) ||
    hasContainerOrSiteInRange(
      room,
      controller.pos,
      CONTROLLER_BUFFER_CONTAINER_RANGE,
    )
  ) {
    return;
  }
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
  const pathIndex = CONTROLLER_BUFFER_CONTAINER_RANGE - 1;
  if (result.incomplete || result.path.length <= pathIndex) {
    return;
  }
  const chosen = result.path[pathIndex];
  if (!chosen) {
    return;
  }
  tryCreateControllerContainerSite(room, chosen);
}

export function runRoomConstruction(room: Room): void {
  if (!room.controller?.my) {
    return;
  }

  if (Game.cpu.bucket < MIN_BUCKET_FOR_CONSTRUCTION_PLAN) {
    log.debugLazy(
      () =>
        `room=${room.name} skip=low_bucket bucket=${Game.cpu.bucket} min=${MIN_BUCKET_FOR_CONSTRUCTION_PLAN}`,
    );
    return;
  }

  const sources = room.find(FIND_SOURCES);
  for (const source of sources) {
    planContainerNearSource(room, source);
  }
  planContainerNearController(room, sources);
}
