import { createLogger } from "./logging/logger";
import { LogLevel } from "./logging/levels";
import { buildCreepSnapshot } from "./management/creepSnapshot";
import type { CreepSnapshot } from "./management/creepSnapshot";
import {
  LOG_MODULE as creepMemoryGcModule,
  runDeadCreepMemoryCleanup,
} from "./management/creepMemoryGc";
import {
  LOG_MODULE as roomManagerModule,
  runRoomManagement,
} from "./management/roomManager";
import {
  LOG_MODULE as spawnManagerModule,
  runSpawnManagement,
} from "./management/spawnManager";
import { LOG_MODULE as builderModule, runBuilder } from "./roles/builder";
import { LOG_MODULE as harvesterModule, runHarvester } from "./roles/harvester";
import { LOG_MODULE as repairerModule, runRepairer } from "./roles/repairer";
import { LOG_MODULE as shuttleModule, runShuttle } from "./roles/shuttle";
import { LOG_MODULE as upgraderModule, runUpgrader } from "./roles/upgrader";

const loopLogger = createLogger("mainLoop", {
  defaultLevel: LogLevel.Information,
});
const creepMemoryGcLogger = createLogger(creepMemoryGcModule, {
  defaultLevel: LogLevel.Information,
  group: "management",
});
const roomLogger = createLogger(roomManagerModule, {
  defaultLevel: LogLevel.Information,
  group: "management",
});
const spawnLogger = createLogger(spawnManagerModule, {
  defaultLevel: LogLevel.Information,
  group: "management",
});
const harvesterLogger = createLogger(harvesterModule, {
  defaultLevel: LogLevel.Information,
  group: "roles",
});
const builderLogger = createLogger(builderModule, {
  defaultLevel: LogLevel.Information,
  group: "roles",
});
const upgraderLogger = createLogger(upgraderModule, {
  defaultLevel: LogLevel.Information,
  group: "roles",
});
const repairerLogger = createLogger(repairerModule, {
  defaultLevel: LogLevel.Information,
  group: "roles",
});
const shuttleLogger = createLogger(shuttleModule, {
  defaultLevel: LogLevel.Information,
  group: "roles",
});

/** Sums creep-array lengths across all room buckets for `moduleScope` stats. */
function sumBucketRoleCount(
  snap: CreepSnapshot,
  roleKey: "harvesters" | "shuttles" | "upgraders" | "builders" | "repairers",
): number {
  let n = 0;
  for (const roomName in snap.byRoom) {
    const bucket = snap.byRoom[roomName];
    if (bucket) {
      n += bucket[roleKey].length;
    }
  }
  return n;
}

export const loop = (): void => {
  let creepSnapshotForStats: CreepSnapshot | null = null;
  loopLogger.moduleScope(
    "tick",
    () => {
      creepMemoryGcLogger.moduleScope("runDeadCreepMemoryCleanup", () => {
        runDeadCreepMemoryCleanup();
      });

      roomLogger.moduleScope("runRoomManagement", () => {
        runRoomManagement();
      });

      creepSnapshotForStats = buildCreepSnapshot();
      const creepSnapshot = creepSnapshotForStats as CreepSnapshot;

      spawnLogger.moduleScope("runSpawnManagement", () => {
        runSpawnManagement(creepSnapshot);
      });

      harvesterLogger.moduleScope(
        "rolePass",
        () => {
          for (const roomName in creepSnapshot.byRoom) {
            const bucket = creepSnapshot.byRoom[roomName];
            if (!bucket) {
              continue;
            }
            for (const creep of bucket.harvesters) {
              runHarvester(creep);
            }
          }
        },
        () => ({ creeps: sumBucketRoleCount(creepSnapshot, "harvesters") }),
      );

      upgraderLogger.moduleScope(
        "rolePass",
        () => {
          for (const roomName in creepSnapshot.byRoom) {
            const bucket = creepSnapshot.byRoom[roomName];
            if (!bucket) {
              continue;
            }
            for (const creep of bucket.upgraders) {
              runUpgrader(creep);
            }
          }
        },
        () => ({ creeps: sumBucketRoleCount(creepSnapshot, "upgraders") }),
      );

      shuttleLogger.moduleScope(
        "rolePass",
        () => {
          for (const roomName in creepSnapshot.byRoom) {
            const bucket = creepSnapshot.byRoom[roomName];
            if (!bucket) {
              continue;
            }
            for (const creep of bucket.shuttles) {
              runShuttle(creep);
            }
          }
        },
        () => ({ creeps: sumBucketRoleCount(creepSnapshot, "shuttles") }),
      );

      builderLogger.moduleScope(
        "rolePass",
        () => {
          for (const roomName in creepSnapshot.byRoom) {
            const bucket = creepSnapshot.byRoom[roomName];
            if (!bucket) {
              continue;
            }
            for (const creep of bucket.builders) {
              runBuilder(creep);
            }
          }
        },
        () => ({ creeps: sumBucketRoleCount(creepSnapshot, "builders") }),
      );

      repairerLogger.moduleScope(
        "rolePass",
        () => {
          for (const roomName in creepSnapshot.byRoom) {
            const bucket = creepSnapshot.byRoom[roomName];
            if (!bucket) {
              continue;
            }
            for (const creep of bucket.repairers) {
              runRepairer(creep);
            }
          }
        },
        () => ({ creeps: sumBucketRoleCount(creepSnapshot, "repairers") }),
      );
    },
    () => ({
      creeps: creepSnapshotForStats?.totalCreepCount ?? 0,
    }),
  );
  loopLogger.blankLineAfterTick();
};
