import { parseLogLevel } from "./logging/levels";

/** In-memory cursor for `xai.room.*` when `roomName` is omitted (not persisted in Memory). */
let roomCursor: string | undefined;

/**
 * Ensures `Memory.rooms[roomName]` exists and returns it for mutation.
 * @param roomName Room key under `Memory.rooms`.
 * @returns Mutable `RoomMemory` shard for the room.
 */
function ensureRoomMemory(roomName: string): RoomMemory {
  if (!Memory.rooms) {
    Memory.rooms = {};
  }
  const rooms = Memory.rooms;
  const existing = rooms[roomName];
  if (!existing) {
    const created: RoomMemory = {};
    rooms[roomName] = created;
    return created;
  }
  return existing;
}

/**
 * Resolves which room to target for `xai.room` helpers, or returns an error string.
 * @param explicitRoomName When set (non-empty), used directly.
 * @returns Room name on success, or a short `Error: …` string.
 */
function resolveRoomNameForXai(explicitRoomName?: string): string {
  if (explicitRoomName !== undefined && explicitRoomName.length > 0) {
    return explicitRoomName;
  }
  if (roomCursor !== undefined) {
    return roomCursor;
  }
  const keys = Object.keys(Game.rooms);
  if (keys.length === 0) {
    return "Error: no visible rooms — cannot infer room (pass roomName or xai.room.use(...))";
  }
  if (keys.length === 1) {
    const only = keys[0];
    if (only === undefined) {
      return "Error: no visible rooms — cannot infer room (pass roomName or xai.room.use(...))";
    }
    return only;
  }
  keys.sort();
  return `Error: multiple rooms visible (${keys.join(", ")}) — pass roomName or xai.room.use(...)`;
}

/**
 * Returns a valid `LogLevelName`, or `null` if the string is not a known level.
 * @remarks Do not use `typeof x === "string"` to distinguish invalid levels — `"error"` is both valid and a string.
 */
function parseLogLevelNameOrNull(level: string): LogLevelName | null {
  return parseLogLevel(level) !== undefined ? (level as LogLevelName) : null;
}

/**
 * Standard message when a console-supplied level string is not recognized.
 * @param level Raw input (shown in the message).
 * @param label Name of the parameter for the message (e.g. `"level"`).
 */
function formatInvalidLogLevelMessage(level: string, label: string): string {
  return `Error: invalid ${label} "${level}" (use error | information | verbose | debug)`;
}

/**
 * Returns `xai` top-level help (sub-namespaces overview).
 */
function xaiHelp(): string {
  return [
    "xai — in-console helpers for Memory.log and room layout fields.",
    "",
    "  xai.log.*   Memory.log defaults, groups, and modules (see xai.log.help())",
    "  xai.room.*  layout viz / plan / approval (see xai.room.help())",
    "",
    "Run xai.log.help() or xai.room.help() for examples.",
  ].join("\n");
}

/**
 * Returns formatted help for `xai.log` helpers (with examples).
 */
function xaiLogHelp(): string {
  return [
    "xai.log — tune Memory.log without hand-editing JSON",
    "",
    "Note: Memory.log is global (not under Memory.rooms[room]). On PTR use global.xai if bare xai is missing.",
    "",
    "Commands:",
    '  xai.log.set("information")',
    '  xai.log.set("error", { groups: { management: "debug" } })',
    '  xai.log.set("error", { modules: { harvester: "debug" } })',
    "  xai.log.reset()",
    '  xai.log.setGroup("management", "debug")',
    '  xai.log.clearGroup("management")',
    '  xai.log.setModule("harvester", "verbose")',
    '  xai.log.clearModule("harvester")',
    "",
    "Groups (createLogger `group`): management | roles",
    "Modules: LOG_MODULE strings (see docs/xai-console.md).",
  ].join("\n");
}

/**
 * Replaces the contents of `Memory.log` with `default` (and optional `modules` / `groups`).
 * Uses in-place mutation when possible so the `Memory.log` reference stays stable for the engine.
 * @remarks Mutates `Memory.log`.
 */
function xaiLogSet(
  level: LogLevelName,
  overrides?: Pick<LogConfigMemory, "modules" | "groups">,
): string {
  const lvl = parseLogLevelNameOrNull(level);
  if (lvl === null) {
    return formatInvalidLogLevelMessage(level, "level");
  }
  Memory.log = Memory.log ?? {};
  const m = Memory.log;
  m.default = lvl;
  if (overrides?.modules) {
    m.modules = { ...overrides.modules };
  } else {
    delete m.modules;
  }
  if (overrides?.groups) {
    m.groups = { ...overrides.groups };
  } else {
    delete m.groups;
  }
  const bits = [`default=${lvl}`];
  if (m.modules) {
    bits.push(`modules=${JSON.stringify(m.modules)}`);
  }
  if (m.groups) {
    bits.push(`groups=${JSON.stringify(m.groups)}`);
  }
  return `Memory.log updated (${bits.join(", ")})`;
}

/**
 * Deletes `Memory.log` so code defaults apply again.
 * @remarks Mutates `Memory`.
 */
function xaiLogReset(): string {
  delete Memory.log;
  return "Memory.log deleted";
}

/**
 * Sets `Memory.log.groups[group] = level`, creating `Memory.log` / `groups` as needed.
 * @remarks Mutates `Memory.log`.
 */
function xaiLogSetGroup(group: string, level: LogLevelName): string {
  const lvl = parseLogLevelNameOrNull(level);
  if (lvl === null) {
    return formatInvalidLogLevelMessage(level, "level");
  }
  Memory.log = Memory.log ?? {};
  Memory.log.groups = Memory.log.groups ?? {};
  Memory.log.groups[group] = lvl;
  return `Memory.log.groups["${group}"]="${lvl}"`;
}

/**
 * Removes one `Memory.log.groups` entry when present.
 * @remarks Mutates `Memory.log`.
 */
function xaiLogClearGroup(group: string): string {
  const groups = Memory.log?.groups;
  if (groups && Object.prototype.hasOwnProperty.call(groups, group)) {
    delete groups[group];
  }
  return `cleared group override "${group}"`;
}

/**
 * Sets `Memory.log.modules[module] = level`, creating `Memory.log` / `modules` as needed.
 * @remarks Mutates `Memory.log`.
 */
function xaiLogSetModule(module: string, level: LogLevelName): string {
  const lvl = parseLogLevelNameOrNull(level);
  if (lvl === null) {
    return formatInvalidLogLevelMessage(level, "level");
  }
  Memory.log = Memory.log ?? {};
  Memory.log.modules = Memory.log.modules ?? {};
  Memory.log.modules[module] = lvl;
  return `Memory.log.modules["${module}"]="${lvl}"`;
}

/**
 * Removes one `Memory.log.modules` entry when present.
 * @remarks Mutates `Memory.log`.
 */
function xaiLogClearModule(moduleId: string): string {
  const modules = Memory.log?.modules;
  if (modules && Object.prototype.hasOwnProperty.call(modules, moduleId)) {
    delete modules[moduleId];
  }
  return `cleared module override "${moduleId}"`;
}

/**
 * Returns formatted help for `xai.room` helpers (with examples).
 */
function xaiRoomHelp(): string {
  return [
    "xai.room — layout visualization and plan fields on Memory.rooms[name]",
    "",
    "Room resolution: pass roomName, else use cursor from xai.room.use(), else single visible",
    "Game.rooms key, else error listing visible rooms.",
    "",
    "Commands:",
    '  xai.room.use("W1N1")',
    "  xai.room.viz()              // layoutVisualize = true",
    "  xai.room.noviz()",
    "  xai.room.rclFilter(3)       // layoutVisualizeRcl = 3",
    "  xai.room.rclFilter()        // delete layoutVisualizeRcl",
    "  xai.room.clearPlan()        // delete layoutPlan + layoutApproved (plan may regenerate next tick)",
    "  xai.room.approve()",
    "  xai.room.unapprove()",
  ].join("\n");
}

/**
 * Sets the in-session room cursor used when `roomName` args are omitted.
 * @remarks Does not write Memory; only updates module state on `xai.room`.
 */
function xaiRoomUse(roomName: string): string {
  roomCursor = roomName;
  return `xai.room cursor="${roomName}"`;
}

/**
 * Sets `layoutVisualize = true` for the resolved room.
 * @remarks Mutates `Memory.rooms[name]`.
 */
function xaiRoomViz(roomName?: string): string {
  const resolved = resolveRoomNameForXai(roomName);
  if (resolved.startsWith("Error:")) {
    return resolved;
  }
  const mem = ensureRoomMemory(resolved);
  mem.layoutVisualize = true;
  return `${resolved}: layoutVisualize=true`;
}

/**
 * Deletes `layoutVisualize` for the resolved room.
 * @remarks Mutates `Memory.rooms[name]`.
 */
function xaiRoomNoviz(roomName?: string): string {
  const resolved = resolveRoomNameForXai(roomName);
  if (resolved.startsWith("Error:")) {
    return resolved;
  }
  const mem = ensureRoomMemory(resolved);
  delete mem.layoutVisualize;
  return `${resolved}: deleted layoutVisualize`;
}

/**
 * Sets or clears the RCL visualization filter (`layoutVisualizeRcl`). Values &gt; 0 set the field; `0` or omit clears it.
 * @remarks Mutates `Memory.rooms[name]`.
 */
function xaiRoomRclFilter(rcl?: number, roomName?: string): string {
  const resolved = resolveRoomNameForXai(roomName);
  if (resolved.startsWith("Error:")) {
    return resolved;
  }
  const mem = ensureRoomMemory(resolved);
  if (rcl === undefined || rcl === 0) {
    delete mem.layoutVisualizeRcl;
    return `${resolved}: deleted layoutVisualizeRcl`;
  }
  mem.layoutVisualizeRcl = rcl;
  return `${resolved}: layoutVisualizeRcl=${rcl}`;
}

/**
 * Deletes both `layoutPlan` and `layoutApproved` for the resolved room.
 * @remarks Mutates `Memory.rooms[name]`.
 */
function xaiRoomClearPlan(roomName?: string): string {
  const resolved = resolveRoomNameForXai(roomName);
  if (resolved.startsWith("Error:")) {
    return resolved;
  }
  const mem = ensureRoomMemory(resolved);
  delete mem.layoutPlan;
  delete mem.layoutApproved;
  return `${resolved}: deleted layoutPlan + layoutApproved`;
}

/**
 * Sets `layoutApproved = true`, warning when `layoutPlan` is missing.
 * @remarks Mutates `Memory.rooms[name]`; may `console.warn` when unplanned.
 */
function xaiRoomApprove(roomName?: string): string {
  const resolved = resolveRoomNameForXai(roomName);
  if (resolved.startsWith("Error:")) {
    return resolved;
  }
  const mem = ensureRoomMemory(resolved);
  if (mem.layoutPlan === undefined) {
    console.warn(
      `[xai.room.approve] ${resolved}: layoutApproved set but layoutPlan is missing`,
    );
  }
  mem.layoutApproved = true;
  const warn = mem.layoutPlan === undefined ? " (warning: no layoutPlan)" : "";
  return `${resolved}: layoutApproved=true${warn}`;
}

/**
 * Deletes `layoutApproved` for the resolved room.
 * @remarks Mutates `Memory.rooms[name]`.
 */
function xaiRoomUnapprove(roomName?: string): string {
  const resolved = resolveRoomNameForXai(roomName);
  if (resolved.startsWith("Error:")) {
    return resolved;
  }
  const mem = ensureRoomMemory(resolved);
  delete mem.layoutApproved;
  return `${resolved}: deleted layoutApproved`;
}

const xaiLogApi: GlobalXaiLog = {
  help: xaiLogHelp,
  set: xaiLogSet,
  reset: xaiLogReset,
  setGroup: xaiLogSetGroup,
  clearGroup: xaiLogClearGroup,
  setModule: xaiLogSetModule,
  clearModule: xaiLogClearModule,
};

const xaiRoomApi: GlobalXaiRoom = {
  help: xaiRoomHelp,
  use: xaiRoomUse,
  viz: xaiRoomViz,
  noviz: xaiRoomNoviz,
  rclFilter: xaiRoomRclFilter,
  clearPlan: xaiRoomClearPlan,
  approve: xaiRoomApprove,
  unapprove: xaiRoomUnapprove,
};

/** Top-level console helpers mounted at `global.xai`. */
export const xai: GlobalXai = {
  help: xaiHelp,
  log: xaiLogApi,
  room: xaiRoomApi,
};
