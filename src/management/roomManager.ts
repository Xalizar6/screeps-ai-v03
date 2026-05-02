import { createLogger } from "../logging/logger";
import { LogLevel } from "../logging/levels";
import {
  LOG_MODULE as layoutConstructorModule,
  runLayoutConstructor,
} from "./construction/layoutConstructor";
import {
  LOG_MODULE as planGeneratorModule,
  runLayoutPlanGenerator,
} from "./construction/planGenerator";
import {
  LOG_MODULE as layoutVisualizerModule,
  runLayoutVisualizer,
} from "./construction/layoutVisualizer";
import {
  CONSTRUCTION_PLAN_INTERVAL,
  runRoomConstruction,
} from "./roomConstruction";
import { LOG_MODULE as roomCacheModule, runRoomCache } from "./roomCache";
import {
  LOG_MODULE as structureCacheModule,
  runStructureCache,
} from "./structureCache";
import { countMyConstructionSitesByRoom } from "./tickSignals";

export const LOG_MODULE = "roomManager" as const;

const roomCacheLogger = createLogger(roomCacheModule, {
  defaultLevel: LogLevel.Information,
  group: "management",
});
const structureCacheLogger = createLogger(structureCacheModule, {
  defaultLevel: LogLevel.Information,
  group: "management",
});
const planGeneratorLogger = createLogger(planGeneratorModule, {
  defaultLevel: LogLevel.Information,
  group: "management",
});
const layoutVisualizerLogger = createLogger(layoutVisualizerModule, {
  defaultLevel: LogLevel.Information,
  group: "management",
});
const layoutConstructorLogger = createLogger(layoutConstructorModule, {
  defaultLevel: LogLevel.Information,
  group: "management",
});

export const runRoomManagement = (): void => {
  const siteCountsByRoom = countMyConstructionSitesByRoom();
  const runConstructionPlan = Game.time % CONSTRUCTION_PLAN_INTERVAL === 0;
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (!room) {
      continue;
    }
    room.memory.lastManagedTick = Game.time;
    room.memory.myConstructionSiteCount = siteCountsByRoom[room.name] ?? 0;
    roomCacheLogger.moduleScope("runRoomCache", () => {
      runRoomCache(room);
    });
    structureCacheLogger.moduleScope("runStructureCache", () => {
      runStructureCache(room);
    });
    planGeneratorLogger.moduleScope("runLayoutPlanGenerator", () => {
      runLayoutPlanGenerator(room);
    });
    layoutVisualizerLogger.moduleScope("runLayoutVisualizer", () => {
      runLayoutVisualizer(room);
    });
    if (runConstructionPlan) {
      runRoomConstruction(room);
      layoutConstructorLogger.moduleScope("runLayoutConstructor", () => {
        runLayoutConstructor(room);
      });
    }
  }
};
