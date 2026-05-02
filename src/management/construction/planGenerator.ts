import { createLogger } from "../../logging/logger";
import { LogLevel } from "../../logging/levels";
import {
  MIN_BUCKET_FOR_CONSTRUCTION_PLAN,
  PATHFINDER_MAX_OPS,
} from "../roomConstruction";

export const LOG_MODULE = "planGenerator" as const;

/** Chebyshev range from the controller where source→controller planned roads stop. */
const LAYOUT_CONTROLLER_ROAD_RANGE = 2;

const log = createLogger(LOG_MODULE, {
  defaultLevel: LogLevel.Information,
  group: "management",
});

/** Single spawn→source or source→controller path job for sequential CostMatrix accumulation. */
interface RoadPathJob {
  origin: RoomPosition;
  /** PathFinder goal: a position or `{ pos, range }` for area goals. */
  destination: RoomPosition | { pos: RoomPosition; range: number };
  label: string;
}

/**
 * Returns the last six characters of an id for compact road segment labels.
 * @param id Full game object id (e.g. source id).
 */
function idSuffix6(id: Id<Source>): string {
  return id.slice(-6);
}

/**
 * Builds ordered PathFinder jobs: for each source (spawn order), spawn→source (range 1), then for each source in the same order, source→controller (`LAYOUT_CONTROLLER_ROAD_RANGE`).
 * Later paths reuse the shared CostMatrix so trunks merge near spawn and toward the controller.
 * @param spawn First owned spawn in the room.
 * @param sources Energy sources sorted by ascending range from `spawn`.
 * @param controller Owned room controller.
 */
function buildRoadPathJobs(
  spawn: StructureSpawn,
  sources: Source[],
  controller: StructureController,
): RoadPathJob[] {
  const jobs: RoadPathJob[] = [];
  for (const source of sources) {
    const id6 = idSuffix6(source.id);
    jobs.push({
      origin: spawn.pos,
      destination: { pos: source.pos, range: 1 },
      label: `spawn→source-${id6}`,
    });
  }
  for (const source of sources) {
    const id6 = idSuffix6(source.id);
    jobs.push({
      origin: source.pos,
      destination: { pos: controller.pos, range: LAYOUT_CONTROLLER_ROAD_RANGE },
      label: `source-${id6}→ctrl`,
    });
  }
  return jobs;
}

/**
 * Seeds PathFinder costs: built roads cheap (1), permanent structures blocked (255); containers and ramparts leave default terrain cost.
 * @param room Room to scan for structures.
 * @param cm Matrix to mutate.
 */
function seedRoadPlannerCostMatrix(room: Room, cm: CostMatrix): void {
  room.find(FIND_STRUCTURES).forEach((s) => {
    if (s.structureType === STRUCTURE_ROAD) {
      cm.set(s.pos.x, s.pos.y, 1);
    } else if (
      s.structureType !== STRUCTURE_CONTAINER &&
      s.structureType !== STRUCTURE_RAMPART
    ) {
      cm.set(s.pos.x, s.pos.y, 255);
    }
  });
}

/**
 * Computes `RoomLayoutPlan` roads via sequential PathFinder runs with CostMatrix accumulation, or leaves roads empty when planning is skipped.
 * Writes `RoomMemory.layoutPlan` only while it is `undefined` (e.g. after `delete Memory.rooms[name].layoutPlan`).
 * Defers PathFinder when `Game.cpu.bucket` is below `MIN_BUCKET_FOR_CONSTRUCTION_PLAN` so a later tick can plan.
 * @param room Owned room to plan in.
 * @remarks Mutates `Memory` when a new plan is stored; leaves `layoutPlan` undefined when deferring for CPU bucket.
 */
export function runLayoutPlanGenerator(room: Room): void {
  if (!room.controller?.my) {
    return;
  }
  if (room.memory.layoutPlan !== undefined) {
    return;
  }
  if (Game.cpu.bucket < MIN_BUCKET_FOR_CONSTRUCTION_PLAN) {
    log.debugLazy(
      () =>
        `${room.name} defer layoutPlan bucket=${Game.cpu.bucket} min=${MIN_BUCKET_FOR_CONSTRUCTION_PLAN}`,
    );
    return;
  }

  const plan: RoomLayoutPlan = {
    generatedAtTick: Game.time,
    roads: [],
    structures: [],
  };

  const spawns = room.find(FIND_MY_SPAWNS);
  const spawn = spawns[0];
  if (!spawn) {
    room.memory.layoutPlan = plan;
    log.debugLazy(
      () => `${room.name} layoutPlan empty roads (no spawn) tick=${Game.time}`,
    );
    return;
  }

  const sources = room
    .find(FIND_SOURCES)
    .sort((a, b) => spawn.pos.getRangeTo(a.pos) - spawn.pos.getRangeTo(b.pos));
  const jobs = buildRoadPathJobs(spawn, sources, room.controller);

  if (jobs.length === 0) {
    room.memory.layoutPlan = plan;
    log.debugLazy(
      () =>
        `${room.name} layoutPlan empty roads (no sources) tick=${Game.time}`,
    );
    return;
  }

  const plannedRoadsCm = new PathFinder.CostMatrix();
  seedRoadPlannerCostMatrix(room, plannedRoadsCm);

  const opts: PathFinderOpts = {
    maxOps: PATHFINDER_MAX_OPS,
    maxRooms: 1,
    plainCost: 2,
    swampCost: 10,
    roomCallback() {
      return plannedRoadsCm;
    },
  };

  for (const { origin, destination, label } of jobs) {
    const result = PathFinder.search(origin, destination, opts);
    if (!result.incomplete) {
      for (const pos of result.path) {
        plannedRoadsCm.set(pos.x, pos.y, 1);
      }
      plan.roads.push({
        label,
        path: result.path.map((p) => [p.x, p.y]),
        rcl: 0,
      });
    } else {
      log.debugLazy(
        () =>
          `${room.name} road path incomplete label=${label} ops=${result.ops}`,
      );
    }
  }

  room.memory.layoutPlan = plan;
  log.debugLazy(
    () =>
      `${room.name} layoutPlan roads=${plan.roads.length} tick=${Game.time}`,
  );
}
