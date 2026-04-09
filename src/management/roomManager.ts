export const runRoomManagement = (): void => {
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (!room) {
      continue;
    }
    room.memory.lastManagedTick = Game.time;
  }
};
