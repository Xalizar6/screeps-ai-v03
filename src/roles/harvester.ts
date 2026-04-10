export const runHarvester = (creep: Creep): void => {
  const debug = (msg: string): void => {
    // Log occasionally to avoid spam across many creeps/ticks.
    if (Game.time % 5 !== 0) return;
    console.log(`[harvester] tick=${Game.time} name=${creep.name} ${msg}`);
  };

  if (creep.store.getFreeCapacity() === 0) {
    debug(
      `state=full energy=${creep.store[RESOURCE_ENERGY]}/${creep.store.getCapacity()}`,
    );
    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
    if (spawn) {
      const result = creep.transfer(spawn, RESOURCE_ENERGY);
      debug(`action=transfer target=${spawn.name} result=${result}`);
      if (result === ERR_NOT_IN_RANGE) {
        const move = creep.moveTo(spawn);
        debug(`action=moveTo target=${spawn.name} result=${move}`);
      }
    } else {
      debug("no_spawn_found");
    }
    return;
  }

  const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  if (source) {
    debug(`state=harvest source=${source.id}`);
    const result = creep.harvest(source);
    debug(`action=harvest source=${source.id} result=${result}`);
    if (result === ERR_NOT_IN_RANGE) {
      const move = creep.moveTo(source);
      debug(`action=moveTo source=${source.id} result=${move}`);
    }
  } else {
    debug("no_active_source_found");
  }
};
