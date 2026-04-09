import { runRoomManagement } from "./management/roomManager";
import { runSpawnManagement } from "./management/spawnManager";
import { runBuilder } from "./roles/builder";
import { runHarvester } from "./roles/harvester";

export const loop = (): void => {
  runRoomManagement();
  runSpawnManagement();

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];

    switch (creep.memory.role) {
      case "harvester":
        runHarvester(creep);
        break;
      case "builder":
        runBuilder(creep);
        break;
      default:
        break;
    }
  }
};
