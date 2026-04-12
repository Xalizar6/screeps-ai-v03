type HarvesterFsmState = "harvest" | "deliver";
type BuilderFsmState = "harvest" | "build";

/** Union of role-local states; each role only uses its subset. */
type RoleFsmStateName = HarvesterFsmState | BuilderFsmState;

type CreepTargetId = Id<Source> | Id<StructureSpawn> | Id<ConstructionSite>;

interface CreepMemory {
  role: "harvester" | "builder";
  /** Role-local FSM state; see `src/roles/harvester.ts` / `builder.ts` for valid values per role. */
  state?: RoleFsmStateName;
  /** Cached target for the current state (source, spawn, or construction site). */
  targetId?: CreepTargetId;
  /** `Game.time` when `state` was last set (for debugging / metrics). */
  stateSinceTick?: number;
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
