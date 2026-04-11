import { createLogger } from "./logging/logger";
import { LogLevel } from "./logging/levels";
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

const loopLogger = createLogger("mainLoop", {
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
    },
    () => ({ creeps: Object.keys(Game.creeps).length }),
  );
  loopLogger.blankLineAfterTick();
};
