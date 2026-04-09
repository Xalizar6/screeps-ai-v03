import { runRoomManagement } from "./management/roomManager";
import { runSpawnManagement } from "./management/spawnManager";
import { runBuilder } from "./roles/builder";
import { runHarvester } from "./roles/harvester";

export const loop = (): void => {
  console.log(`[loop:start] tick=${Game.time}`);

  runRoomManagement();
  runSpawnManagement();

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    if (!creep) {
      continue;
    }

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

  console.log(`[loop:end] tick=${Game.time}`);
};
