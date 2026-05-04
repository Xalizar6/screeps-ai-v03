type HarvesterFsmState = "harvest" | "deliver";
type BuilderFsmState = "harvest" | "build";
type UpgraderFsmState = "harvest" | "upgrade";
type RepairerFsmState = "harvest" | "repair";
type ShuttleFsmState = "harvest" | "deliver" | "deliverController";

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
  /** `shuttle` only: body profile id for spawn math and future body variants (see `shuttleDemand.ts`). */
  shuttleProfileId?: string;
  /** `harvester` primary source assignment to keep a stable miner/source pairing. */
  sourceId?: Id<Source>;
  /** Role-local FSM state; see role modules under `src/roles/` (e.g. shuttle `harvest` / `deliver` / `deliverController`). */
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
  groups?: Partial<Record<string, LogLevelName>>;
}

interface Memory {
  creeps?: Record<string, CreepMemory>;
  log?: LogConfigMemory;
  /** Per-room persistent state (layout, sources cache, etc.); keys are room names. */
  rooms?: Record<string, RoomMemory>;
}

/** `Memory.log` + room console helpers under `global.xai`. */
interface GlobalXaiLog {
  help(): string;
  set(
    level: LogLevelName,
    overrides?: Pick<LogConfigMemory, "modules" | "groups">,
  ): string;
  reset(): string;
  setGroup(group: string, level: LogLevelName): string;
  clearGroup(group: string): string;
  setModule(module: string, level: LogLevelName): string;
  clearModule(module: string): string;
}

/** Room layout / Memory.rooms console helpers under `global.xai.room`. */
interface GlobalXaiRoom {
  help(): string;
  use(roomName: string): string;
  viz(roomName?: string): string;
  noviz(roomName?: string): string;
  rclFilter(rcl?: number, roomName?: string): string;
  clearPlan(roomName?: string): string;
  approve(roomName?: string): string;
  unapprove(roomName?: string): string;
}

/** Console helper namespace attached to `global.xai` from `src/console.ts`. */
interface GlobalXai {
  help(): string;
  log: GlobalXaiLog;
  room: GlobalXaiRoom;
}

declare global {
  /** So `globalThis.xai` / `global.xai` assignments in bootstrap code typecheck. */
  interface GlobalThis {
    xai: GlobalXai;
  }
}

// Ambient global for screeps console `xai` (matches runtime `global.xai`); `var` is standard for declare.
// eslint-disable-next-line no-var -- ambient global binding; `var` matches TS handbook / Screeps examples
declare var xai: GlobalXai;

/** One planned road polyline; coordinates are room-local [x, y] tiles (serializable). */
interface RoadSegmentPlan {
  /** Human-readable id, e.g. `spawn→source-5bbcaf`. */
  label: string;
  /** Tile path `[[x,y], …]` — compact in serialized Memory. */
  path: [number, number][];
  /** Minimum RCL at which this segment may be built (`0` = always allowed once approved). */
  rcl: number;
}

/** Planned structure position for layout approval and staged construction. */
interface StructurePlacementPlan {
  type: BuildableStructureConstant;
  pos: [number, number];
  /** RCL at which this structure becomes placeable (matches game unlock progression tagging). */
  rcl: number;
}

/** Serialized room layout produced by `planGenerator` and consumed by visualizer + constructor. */
interface RoomLayoutPlan {
  /** `Game.time` when this plan was last (re)generated; useful for console inspection and staleness detection. */
  generatedAtTick: number;
  roads: RoadSegmentPlan[];
  structures: StructurePlacementPlan[];
}

interface RoomMemory {
  lastManagedTick?: number;
  /** Count of `my` construction sites in this room; refreshed each tick in `roomManager` from `Game.constructionSites`. */
  myConstructionSiteCount?: number;
  /** Source IDs -> nearby container cache; maintained by `src/management/roomCache.ts`. */
  sources?: Record<Id<Source>, SourceMemory>;
  /** Controller buffer container within scan/plan radius of the controller; see `roomCache` / `roomConstruction`. */
  controllerContainerId?: Id<StructureContainer>;
  /** Layout automation: planned roads and structures; see `src/management/construction/planGenerator.ts`. */
  layoutPlan?: RoomLayoutPlan;
  /** When true, `layoutVisualizer` draws `layoutPlan` each tick (no CPU-heavy planning). */
  layoutVisualize?: boolean;
  /** `0` or unset = all RCL layers; `N` = show items at or below RCL N (cumulative). */
  layoutVisualizeRcl?: number;
  /** When true, `layoutConstructor` may place sites from `layoutPlan` on the construction interval. */
  layoutApproved?: boolean;
}
