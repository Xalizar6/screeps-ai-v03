type HarvesterFsmState = "harvest" | "deliver";
type BuilderFsmState = "harvest" | "build";
type UpgraderFsmState = "harvest" | "upgrade";
type RepairerFsmState = "harvest" | "repair";
type ShuttleFsmState = "harvest" | "deliver";

/** Union of role-local states; each role only uses its subset. */
type RoleFsmStateName =
  | HarvesterFsmState
  | BuilderFsmState
  | UpgraderFsmState
  | RepairerFsmState
  | ShuttleFsmState;

type CreepTargetId =
  | Id<Source>
  | Id<StructureSpawn>
  | Id<StructureExtension>
  | Id<StructureTower>
  | Id<ConstructionSite>
  | Id<StructureController>
  | Id<StructureContainer>
  | Id<Resource>;

/** Per-source data cached in `RoomMemory.sources` (see `src/management/roomCache.ts`). */
interface SourceMemory {
  containerId?: Id<StructureContainer>;
}

interface CreepMemory {
  role: "harvester" | "builder" | "upgrader" | "repairer" | "shuttle";
  /** Role-local FSM state; see `src/roles/harvester.ts` / `builder.ts` / `upgrader.ts` for valid values per role. */
  state?: RoleFsmStateName;
  /** Cached target for the current state (source, spawn, site, controller, container, or dropped resource). */
  targetId?: CreepTargetId;
  /** `repairer` only: structure being repaired (persists across harvest so 50–95% jobs continue). */
  repairTargetId?: Id<Structure>;
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
  creeps?: Record<string, CreepMemory>;
  log?: LogConfigMemory;
}

interface RoomMemory {
  lastManagedTick?: number;
  /** Source IDs -> nearby container cache; maintained by `src/management/roomCache.ts`. */
  sources?: Record<Id<Source>, SourceMemory>;
}
