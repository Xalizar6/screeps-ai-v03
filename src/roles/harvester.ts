export const runHarvester = (creep: Creep): void => {
  if (creep.store.getFreeCapacity() === 0) {
    const spawn = creep.room.find(FIND_MY_SPAWNS)[0];
    if (spawn) {
      creep.transfer(spawn, RESOURCE_ENERGY);
    }
    return;
  }

  const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
  if (source) {
    creep.harvest(source);
  }
};
