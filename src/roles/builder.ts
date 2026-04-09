export const runBuilder = (creep: Creep): void => {
  if (creep.store[RESOURCE_ENERGY] === 0) {
    const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    if (source) {
      creep.harvest(source);
    }
    return;
  }

  const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  if (site) {
    creep.build(site);
  }
};
