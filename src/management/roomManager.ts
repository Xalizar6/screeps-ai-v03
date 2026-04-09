export const runRoomManagement = (): void => {
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    room.memory.lastManagedTick = Game.time;
  }
};
