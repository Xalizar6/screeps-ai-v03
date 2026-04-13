import {
  CONSTRUCTION_PLAN_INTERVAL,
  runRoomConstruction,
} from "./roomConstruction";

export const LOG_MODULE = "roomManager" as const;

export const runRoomManagement = (): void => {
  const runConstructionPlan = Game.time % CONSTRUCTION_PLAN_INTERVAL === 0;
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (!room) {
      continue;
    }
    room.memory.lastManagedTick = Game.time;
    if (runConstructionPlan) {
      runRoomConstruction(room);
    }
  }
};
