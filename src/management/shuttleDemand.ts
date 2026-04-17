import { getUnfilledEnergyStructures } from "./structureCache";

/** Default shuttle body profile id; keep stable for `Memory` and logs. */
export const DEFAULT_SHUTTLE_PROFILE_ID = "default" as const;

/** Known shuttle spawn profiles (extend as roles specialize). */
export const SHUTTLE_PROFILE_BODIES: Record<
  typeof DEFAULT_SHUTTLE_PROFILE_ID,
  BodyPartConstant[]
> = {
  default: [WORK, CARRY, MOVE, MOVE],
};

/** Minimum shuttles per room (always keep at least one logistics creep). */
export const SHUTTLE_COUNT_MIN = 1;
/** Hard cap to avoid runaway spawns if estimates are wrong. */
export const SHUTTLE_COUNT_MAX = 8;

/** Spread structure energy deficit across this many ticks (smooth refill demand). */
export const SHUTTLE_REFILL_DEFICIT_SMOOTH_TICKS = 50;

/** Baseline full cycle estimate (harvest + walk + transfer + return) when layout is unknown. */
export const SHUTTLE_BASE_ROUND_TRIP_TICKS = 28;
/** Reduce estimate when source-side container exists (less carry from remote). */
export const SHUTTLE_ROUND_TRIP_SOURCE_CONTAINER_BONUS = 6;
/** Reduce estimate when controller buffer container exists (shorter post-fill path). */
export const SHUTTLE_ROUND_TRIP_CONTROLLER_CONTAINER_BONUS = 4;

export type ShuttleDemandBreakdown = {
  upgraderWorkParts: number;
  controllerDemandPerTick: number;
  structureDeficitEnergy: number;
  refillDemandPerTick: number;
  requiredEnergyPerTick: number;
  carryPerTrip: number;
  estimatedRoundTripTicks: number;
  shuttleThroughputPerTick: number;
  desiredShuttles: number;
};

/**
 * Counts how many times `part` appears in a creep body blueprint or live body.
 * @param body Body layout or `Creep.body` map list
 */
export function countBodyParts(
  body: BodyPartConstant[] | readonly BodyPartDefinition[],
  part: BodyPartConstant,
): number {
  let n = 0;
  for (const entry of body) {
    const p = typeof entry === "string" ? entry : entry.type;
    if (p === part) {
      n++;
    }
  }
  return n;
}

/**
 * Total energy a creep with this body can carry (50 per `CARRY`).
 * @param body Spawn blueprint
 */
export function getCarryCapacityFromBody(body: BodyPartConstant[]): number {
  return countBodyParts(body, CARRY) * CARRY_CAPACITY;
}

/**
 * Sums `WORK` parts on upgraders assigned to this room (body-aware sustained draw).
 * @param room Room to measure
 */
export function sumUpgraderWorkPartsInRoom(room: Room): number {
  let work = 0;
  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (
      !creep ||
      creep.memory.role !== "upgrader" ||
      creep.room.name !== room.name
    ) {
      continue;
    }
    work += countBodyParts(creep.body, WORK);
  }
  return work;
}

/**
 * Sums remaining energy capacity on owned spawn/extension/tower structures in the list.
 * @param unfilled Output of {@link getUnfilledEnergyStructures}
 */
export function sumOwnedStructureEnergyDeficit(
  unfilled: AnyStoreStructure[],
): number {
  let sum = 0;
  for (const s of unfilled) {
    sum += s.store.getFreeCapacity(RESOURCE_ENERGY);
  }
  return sum;
}

/**
 * Heuristic round-trip ticks for one shuttle cycle; uses cached room ids only (no pathing).
 * @param room Room being estimated
 * @param shuttleBody Body used for carry capacity (reserved for future MOVE ratio tuning)
 */
export function estimateShuttleRoundTripTicks(
  room: Room,
  shuttleBody: BodyPartConstant[],
): number {
  void shuttleBody;
  let ticks = SHUTTLE_BASE_ROUND_TRIP_TICKS;
  const sourcesMem = room.memory.sources;
  if (sourcesMem) {
    for (const sourceIdStr in sourcesMem) {
      const entry = sourcesMem[sourceIdStr as Id<Source>];
      if (entry?.containerId) {
        ticks -= SHUTTLE_ROUND_TRIP_SOURCE_CONTAINER_BONUS;
        break;
      }
    }
  }
  if (room.memory.controllerContainerId) {
    ticks -= SHUTTLE_ROUND_TRIP_CONTROLLER_CONTAINER_BONUS;
  }
  return Math.max(8, ticks);
}

/**
 * Energy per tick one shuttle can move from harvest to sinks given body and trip estimate.
 * @param shuttleBody Spawn blueprint for shuttles
 * @param roundTripTicks Estimated harvest-to-delivery cycle length
 */
export function getShuttleThroughputPerTick(
  shuttleBody: BodyPartConstant[],
  roundTripTicks: number,
): number {
  const carry = getCarryCapacityFromBody(shuttleBody);
  if (roundTripTicks <= 0 || carry <= 0) {
    return 0;
  }
  return carry / roundTripTicks;
}

/**
 * Computes desired shuttle count from upgrader WORK draw, structure refill deficit, and modeled throughput.
 * @param room Owned room with cache already run for this tick
 * @param shuttleBody Body profile used for throughput (must match spawned shuttles for this profile)
 */
export function computeShuttleDemand(
  room: Room,
  shuttleBody: BodyPartConstant[],
): ShuttleDemandBreakdown {
  const upgraderWorkParts = sumUpgraderWorkPartsInRoom(room);
  const controllerDemandPerTick = upgraderWorkParts;

  const unfilled = getUnfilledEnergyStructures(room);
  const structureDeficitEnergy = sumOwnedStructureEnergyDeficit(unfilled);
  const refillDemandPerTick =
    structureDeficitEnergy / SHUTTLE_REFILL_DEFICIT_SMOOTH_TICKS;

  const requiredEnergyPerTick = controllerDemandPerTick + refillDemandPerTick;

  const estimatedRoundTripTicks = estimateShuttleRoundTripTicks(
    room,
    shuttleBody,
  );
  const shuttleThroughputPerTick = getShuttleThroughputPerTick(
    shuttleBody,
    estimatedRoundTripTicks,
  );

  let desiredShuttles = SHUTTLE_COUNT_MIN;
  if (shuttleThroughputPerTick > 0) {
    desiredShuttles = Math.ceil(
      requiredEnergyPerTick / shuttleThroughputPerTick,
    );
  }
  desiredShuttles = Math.min(
    SHUTTLE_COUNT_MAX,
    Math.max(SHUTTLE_COUNT_MIN, desiredShuttles),
  );

  return {
    upgraderWorkParts,
    controllerDemandPerTick,
    structureDeficitEnergy,
    refillDemandPerTick,
    requiredEnergyPerTick,
    carryPerTrip: getCarryCapacityFromBody(shuttleBody),
    estimatedRoundTripTicks,
    shuttleThroughputPerTick,
    desiredShuttles,
  };
}

/**
 * Resolves spawn body for a shuttle profile id; unknown ids fall back to default.
 * @param profileId Profile key from creep memory
 */
export function resolveShuttleBody(
  profileId: string | undefined,
): BodyPartConstant[] {
  if (profileId === DEFAULT_SHUTTLE_PROFILE_ID || profileId === undefined) {
    return [...SHUTTLE_PROFILE_BODIES[DEFAULT_SHUTTLE_PROFILE_ID]];
  }
  const body =
    SHUTTLE_PROFILE_BODIES[profileId as keyof typeof SHUTTLE_PROFILE_BODIES];
  if (body) {
    return [...body];
  }
  return [...SHUTTLE_PROFILE_BODIES[DEFAULT_SHUTTLE_PROFILE_ID]];
}
