import { createLogger } from "../../logging/logger";
import { LogLevel } from "../../logging/levels";

export const LOG_MODULE = "layoutVisualizer" as const;

const log = createLogger(LOG_MODULE, { defaultLevel: LogLevel.Information });

/** Distinct stroke colors for road segment overlays (rotated by segment index). */
const ROAD_SEGMENT_PALETTE = [
  "#ff6666",
  "#66ff66",
  "#6666ff",
  "#ffff44",
  "#ff44ff",
  "#44ffff",
];

/** Vertical gap between stacked road segment labels (tiles). Prevents overlap when segments share a starting tile near spawn. */
const LABEL_Y_STEP = 0.65;

/**
 * @returns Whether `itemRcl` should be drawn for the current visualize filter (`0`/unset = all layers; `N` = items at or below RCL N).
 */
function matchesVisualizeRclFilter(
  itemRcl: number,
  filterRaw: number | undefined,
): boolean {
  if (filterRaw === undefined || filterRaw === 0) {
    return true;
  }
  return itemRcl <= filterRaw;
}

/**
 * Picks a fill color for planned structure type markers.
 */
function structurePlanColor(structureType: BuildableStructureConstant): string {
  switch (structureType) {
    case STRUCTURE_EXTENSION:
      return "#8888ff";
    case STRUCTURE_TOWER:
      return "#ff4444";
    case STRUCTURE_CONTAINER:
      return "#44cc44";
    case STRUCTURE_STORAGE:
      return "#cccc66";
    case STRUCTURE_RAMPART:
    case STRUCTURE_WALL:
      return "#aa8866";
    default:
      return "#cccccc";
  }
}

/**
 * Renders `layoutPlan` for human review (roads as dotted polylines + vertices; structures as labeled rects).
 * No game intents; safe to run every tick when `layoutVisualize` is enabled.
 * @param room Room whose `memory.layoutPlan` may be drawn.
 */
export function runLayoutVisualizer(room: Room): void {
  if (!room.controller?.my) {
    return;
  }
  if (room.memory.layoutVisualize !== true) {
    return;
  }
  const plan = room.memory.layoutPlan;
  if (!plan) {
    return;
  }

  const visual = room.visual;
  const rclFilter = room.memory.layoutVisualizeRcl;

  plan.roads.forEach((segment, segmentIndex) => {
    if (!matchesVisualizeRclFilter(segment.rcl, rclFilter)) {
      return;
    }
    const stroke =
      ROAD_SEGMENT_PALETTE[segmentIndex % ROAD_SEGMENT_PALETTE.length];
    const path = segment.path;
    if (path.length === 0) {
      return;
    }

    const polyPoints: [number, number][] = [];
    for (const [x, y] of path) {
      polyPoints.push([x, y]);
      visual.circle(x, y, {
        radius: 0.25,
        fill: stroke,
        opacity: 0.85,
        stroke,
        strokeWidth: 0.06,
      });
    }
    if (polyPoints.length >= 2) {
      visual.poly(polyPoints, {
        stroke,
        opacity: 0.75,
        strokeWidth: 0.08,
        lineStyle: "dotted",
      });
    }
    const labelAnchor = path[0];
    if (labelAnchor) {
      const [lx, ly] = labelAnchor;
      visual.text(segment.label, lx, ly - segmentIndex * LABEL_Y_STEP, {
        align: "left",
        font: 0.45,
        opacity: 0.95,
        stroke: "#000000",
        strokeWidth: 0.12,
        color: stroke,
      });
    }
  });

  for (const s of plan.structures) {
    if (!matchesVisualizeRclFilter(s.rcl, rclFilter)) {
      continue;
    }
    const [x, y] = s.pos;
    const fill = structurePlanColor(s.type);
    visual.rect(x - 0.35, y - 0.35, 0.7, 0.7, {
      fill,
      opacity: 0.65,
      stroke: "#222222",
      strokeWidth: 0.05,
    });
    visual.text(`${s.type}[r${s.rcl}]`, x, y - 0.85, {
      align: "center",
      font: 0.4,
      opacity: 0.95,
      stroke: "#000000",
      strokeWidth: 0.1,
      color: "#ffffff",
    });
  }

  log.debugLazy(
    () =>
      `${room.name} viz roads=${plan.roads.length} structures=${plan.structures.length}`,
  );
}
