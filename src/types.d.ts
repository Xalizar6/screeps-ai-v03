interface CreepMemory {
  role: "harvester" | "builder";
}

/** Runtime strings must match `Memory.log` values; see `src/logging/levels.ts` `parseLogLevel`. */
type LogLevelName = "error" | "information" | "verbose" | "debug";

interface LogConfigMemory {
  default?: LogLevelName;
  modules?: Partial<Record<string, LogLevelName>>;
}

interface Memory {
  log?: LogConfigMemory;
}

interface RoomMemory {
  lastManagedTick?: number;
}
