import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import type { CreepSnapshot } from "./creepSnapshot";
import { getRoomCreepBucket } from "./creepSnapshot";
import { countRepairBacklog } from "./repairConfig";
import {
  computeShuttleDemand,
  DEFAULT_SHUTTLE_PROFILE_ID,
  SHUTTLE_PROFILE_BODIES,
} from "./shuttleDemand";

export const LOG_MODULE = "spawnManager" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

const DEFAULT_BODY: BodyPartConstant[] = [WORK, CARRY, MOVE];
/** Extra MOVE vs {@link DEFAULT_BODY} so full CARRY does not slow travel as much. */
const BUILDER_BODY: BodyPartConstant[] = [WORK, CARRY, MOVE, MOVE];
const SHUTTLE_BODY: BodyPartConstant[] = [
  ...SHUTTLE_PROFILE_BODIES[DEFAULT_SHUTTLE_PROFILE_ID],
];
/** Extra WORK vs {@link DEFAULT_BODY} to increase mining rate . */
const HARVESTER_BODY: BodyPartConstant[] = [WORK, WORK, CARRY, MOVE];

function pickUnclaimedSourceId(
  room: Room,
  harvesters: Creep[],
): Id<Source> | undefined {
  const sourcesMem = room.memory.sources;
  if (!sourcesMem) {
    return undefined;
  }

  const claimed = new Set<Id<Source>>();
  for (const harvester of harvesters) {
    const sourceId = harvester.memory.sourceId;
    if (sourceId) {
      claimed.add(sourceId);
    }
  }

  for (const sourceIdStr of Object.keys(sourcesMem)) {
    const sourceId = sourceIdStr as Id<Source>;
    if (!claimed.has(sourceId)) {
      return sourceId;
    }
  }
  return undefined;
}

function getDesiredHarvesterCount(room: Room): number {
  const cachedSources = room.memory.sources;
  if (cachedSources) {
    return Object.keys(cachedSources).length;
  }
  return room.find(FIND_SOURCES).length;
}

/**
 * Spawns creeps using a pre-built per-tick creep snapshot (one global creep pass).
 * @param snapshot From `buildCreepSnapshot()` in `creepSnapshot.ts` for this tick
 */
export const runSpawnManagement = (snapshot: CreepSnapshot): void => {
  for (const spawnName in Game.spawns) {
    const spawn = Game.spawns[spawnName];
    if (!spawn) {
      continue;
    }

    const spawningNow = spawn.spawning;
    if (spawningNow) {
      log.debugLazy(
        () =>
          `spawn=${spawn.name} skip=already_spawning current=${spawningNow.name}`,
      );
      continue;
    }

    const roomName = spawn.room.name;
    const bucket = getRoomCreepBucket(roomName, snapshot);
    const harvesters = bucket.harvesters;
    const desiredHarvesters = getDesiredHarvesterCount(spawn.room);

    if (harvesters.length < desiredHarvesters) {
      const sourceId = pickUnclaimedSourceId(spawn.room, harvesters);
      const code = spawn.spawnCreep(HARVESTER_BODY, `harvester-${Game.time}`, {
        memory: { role: "harvester", sourceId },
      });
      log.debugLazy(
        () =>
          `spawn=${spawn.name} branch=harvester have=${harvesters.length} need=${desiredHarvesters} bodyCost=${bodyCost(
            HARVESTER_BODY,
          )} energy=${spawn.room.energyAvailable} sourceId=${sourceId ?? "none"} code=${code}`,
      );
      continue;
    }

    const shuttles = bucket.shuttles;
    const shuttleDemand = computeShuttleDemand(
      spawn.room,
      SHUTTLE_BODY,
      bucket.upgraderWorkParts,
    );
    const desiredShuttles = shuttleDemand.desiredShuttles;
    if (shuttles.length < desiredShuttles) {
      const code = spawn.spawnCreep(SHUTTLE_BODY, `shuttle-${Game.time}`, {
        memory: {
          role: "shuttle",
          shuttleProfileId: DEFAULT_SHUTTLE_PROFILE_ID,
        },
      });
      log.debugLazy(
        () =>
          `spawn=${spawn.name} branch=shuttle have=${shuttles.length} desired=${desiredShuttles} profile=${DEFAULT_SHUTTLE_PROFILE_ID} workParts=${shuttleDemand.upgraderWorkParts} requiredPerTick=${shuttleDemand.requiredEnergyPerTick.toFixed(2)} throughput=${shuttleDemand.shuttleThroughputPerTick.toFixed(2)} roundTrip=${shuttleDemand.estimatedRoundTripTicks} deficitEnergy=${shuttleDemand.structureDeficitEnergy} bodyCost=${bodyCost(
            SHUTTLE_BODY,
          )} energy=${spawn.room.energyAvailable} code=${code}`,
      );
      continue;
    }

    const upgraders = bucket.upgraders;

    if (upgraders.length < 3) {
      const code = spawn.spawnCreep(DEFAULT_BODY, `upgrader-${Game.time}`, {
        memory: { role: "upgrader" },
      });
      log.debugLazy(
        () =>
          `spawn=${spawn.name} branch=upgrader have=${upgraders.length} need=3 bodyCost=${bodyCost(
            DEFAULT_BODY,
          )} energy=${spawn.room.energyAvailable} code=${code}`,
      );
      continue;
    }

    const builders = bucket.builders;

    const unfinishedSites = spawn.room.memory.myConstructionSiteCount ?? 0;
    const desiredBuilders = Math.ceil(unfinishedSites / 3);

    if (builders.length < desiredBuilders) {
      const code = spawn.spawnCreep(BUILDER_BODY, `builder-${Game.time}`, {
        memory: { role: "builder" },
      });
      log.debugLazy(
        () =>
          `spawn=${spawn.name} branch=builder have=${builders.length} desired=${desiredBuilders} sites=${unfinishedSites} bodyCost=${bodyCost(
            BUILDER_BODY,
          )} energy=${spawn.room.energyAvailable} code=${code}`,
      );
      continue;
    }

    const repairers = bucket.repairers;

    const repairBacklog = countRepairBacklog(spawn.room);
    const desiredRepairers = Math.ceil(repairBacklog / 3);
    const needMoreRepairers = repairers.length < desiredRepairers;

    if (needMoreRepairers) {
      const code = spawn.spawnCreep(DEFAULT_BODY, `repairer-${Game.time}`, {
        memory: { role: "repairer" },
      });
      log.debugLazy(
        () =>
          `spawn=${spawn.name} branch=repair backlog=${repairBacklog} desiredRepairers=${desiredRepairers} repairers=${repairers.length} bodyCost=${bodyCost(
            DEFAULT_BODY,
          )} energy=${spawn.room.energyAvailable} code=${code}`,
      );
    } else {
      log.debugLazy(
        () =>
          `spawn=${spawn.name} branch=idle reason=no_spawn_needed energy=${spawn.room.energyAvailable}`,
      );
    }
  }
};

function bodyCost(body: BodyPartConstant[]): number {
  let sum = 0;
  for (const part of body) {
    sum += BODYPART_COST[part];
  }
  return sum;
}
