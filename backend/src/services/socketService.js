export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join room for specific parking regions or general updates
    socket.on('join:parking', () => {
      socket.join('parking-updates');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Export a function to emit updates from other parts of the app
  global.io = io;
};

export const broadcastSpotUpdate = (spot) => {
  if (global.io) {
    global.io.to('parking-updates').emit('spot:update', spot);
  }
};
