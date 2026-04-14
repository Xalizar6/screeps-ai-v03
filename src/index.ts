import { createLogger } from "./logging/logger";
import { LogLevel } from "./logging/levels";
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
import { LOG_MODULE as upgraderModule, runUpgrader } from "./roles/upgrader";

const loopLogger = createLogger("mainLoop", {
  defaultLevel: LogLevel.Information,
});
const creepMemoryGcLogger = createLogger(creepMemoryGcModule, {
  defaultLevel: LogLevel.Information,
});
const roomLogger = createLogger(roomManagerModule, {
  defaultLevel: LogLevel.Information,
});
const spawnLogger = createLogger(spawnManagerModule, {
  defaultLevel: LogLevel.Information,
});
const harvesterLogger = createLogger(harvesterModule, {
  defaultLevel: LogLevel.Information,
});
const builderLogger = createLogger(builderModule, {
  defaultLevel: LogLevel.Information,
});
const upgraderLogger = createLogger(upgraderModule, {
  defaultLevel: LogLevel.Information,
});
const repairerLogger = createLogger(repairerModule, {
  defaultLevel: LogLevel.Information,
});

function countCreepsByRole(role: CreepMemory["role"]): number {
  let n = 0;
  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (creep?.memory.role === role) {
      n++;
    }
  }
  return n;
}

export const loop = (): void => {
  loopLogger.moduleScope(
    "tick",
    () => {
      creepMemoryGcLogger.moduleScope("runDeadCreepMemoryCleanup", () => {
        runDeadCreepMemoryCleanup();
      });

      roomLogger.moduleScope("runRoomManagement", () => {
        runRoomManagement();
      });

      spawnLogger.moduleScope("runSpawnManagement", () => {
        runSpawnManagement();
      });

      harvesterLogger.moduleScope(
        "rolePass",
        () => {
          for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            if (!creep || creep.memory.role !== "harvester") {
              continue;
            }
            runHarvester(creep);
          }
        },
        () => ({ creeps: countCreepsByRole("harvester") }),
      );

      upgraderLogger.moduleScope(
        "rolePass",
        () => {
          for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            if (!creep || creep.memory.role !== "upgrader") {
              continue;
            }
            runUpgrader(creep);
          }
        },
        () => ({ creeps: countCreepsByRole("upgrader") }),
      );

      builderLogger.moduleScope(
        "rolePass",
        () => {
          for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            if (!creep || creep.memory.role !== "builder") {
              continue;
            }
            runBuilder(creep);
          }
        },
        () => ({ creeps: countCreepsByRole("builder") }),
      );

      repairerLogger.moduleScope(
        "rolePass",
        () => {
          for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            if (!creep || creep.memory.role !== "repairer") {
              continue;
            }
            runRepairer(creep);
          }
        },
        () => ({ creeps: countCreepsByRole("repairer") }),
      );
    },
    () => ({ creeps: Object.keys(Game.creeps).length }),
  );
  loopLogger.blankLineAfterTick();
};
