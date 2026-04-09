export const runBuilder = (creep: Creep): void => {
  const debug = (msg: string): void => {
    // Log occasionally to avoid spam across many creeps/ticks.
    if (Game.time % 5 !== 0) return;
    console.log(`[builder] tick=${Game.time} name=${creep.name} ${msg}`);
  };

  if (creep.store[RESOURCE_ENERGY] === 0) {
    debug(
      `state=empty energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()}`
    );
    const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
    if (source) {
      debug(`action=harvest source=${source.id}`);
      const result = creep.harvest(source);
      debug(`action=harvest result=${result}`);
      if (result === ERR_NOT_IN_RANGE) {
        const move = creep.moveTo(source);
        debug(`action=moveTo source=${source.id} result=${move}`);
      }
    } else {
      debug("no_active_source_found");
    }
    return;
  }

  const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
  if (site) {
    debug(
      `state=build energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()} site=${site.id}`
    );
    const result = creep.build(site);
    debug(`action=build result=${result}`);
    if (result === ERR_NOT_IN_RANGE) {
      const move = creep.moveTo(site);
      debug(`action=moveTo site=${site.id} result=${move}`);
    }
  } else {
    debug("no_construction_site_found");
  }
};
