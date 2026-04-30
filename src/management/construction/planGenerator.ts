import { createLogger } from "../../logging/logger";
import { LogLevel } from "../../logging/levels";

export const LOG_MODULE = "planGenerator" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

/**
 * Ensures an empty layout plan exists when none is stored so Phase 1 can be validated with console-injected plans or future PathFinder output.
 * Writes `RoomMemory.layoutPlan` only while it is `undefined` (e.g. after `delete Memory.rooms[name].layoutPlan`).
 * @param room Owned room to potentially initialize.
 * @remarks Mutates `Memory` only when `layoutPlan` was cleared or never set; side-effect free when a plan already exists.
 */
export function runLayoutPlanGenerator(room: Room): void {
  if (!room.controller?.my) {
    return;
  }
  if (room.memory.layoutPlan !== undefined) {
    return;
  }
  room.memory.layoutPlan = {
    generatedAtTick: Game.time,
    roads: [],
    structures: [],
  };
  log.debugLazy(
    () => `${room.name} initialized empty layoutPlan tick=${Game.time}`,
  );
}
