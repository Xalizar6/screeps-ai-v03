export const LOG_MODULE = "creepMemoryGc" as const;

/** Drop `Memory.creeps` keys for creeps that no longer exist in `Game.creeps`. */
export function runDeadCreepMemoryCleanup(): void {
  const mem = Memory.creeps;
  if (!mem) {
    return;
  }
  for (const name in mem) {
    if (!(name in Game.creeps)) {
      delete mem[name];
    }
  }
}
