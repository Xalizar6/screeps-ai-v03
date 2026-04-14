/**
 * Repairable structure types and priority order (first = highest priority when choosing targets).
 * Extend `REPAIR_STRUCTURE_TYPE_ORDER` when adding towers, walls, etc.
 */
export const REPAIR_STRUCTURE_TYPE_ORDER: readonly StructureConstant[] = [
  STRUCTURE_CONTAINER,
  STRUCTURE_ROAD,
];

const repairTypePriority = new Map<StructureConstant, number>(
  REPAIR_STRUCTURE_TYPE_ORDER.map((t, i) => [t, i]),
);

export function isRepairCandidateType(
  structureType: StructureConstant,
): boolean {
  return repairTypePriority.has(structureType);
}

/** Lower = higher priority; unknown types sort last. */
export function getRepairTypePriority(
  structureType: StructureConstant,
): number {
  return repairTypePriority.get(structureType) ?? Number.MAX_SAFE_INTEGER;
}

/** Structures that need new repair assignments (strict entry: below 50% hits). */
export function countRepairBacklog(room: Room): number {
  return room.find(FIND_STRUCTURES, {
    filter: (s) =>
      isRepairCandidateType(s.structureType) && s.hits < s.hitsMax * 0.5,
  }).length;
}
