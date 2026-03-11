let io = null;

function setServer(socketServer) {
  io = socketServer;
}

function emitToDashboard(event, data) {
  if (io) io.emit(event, data);
}

function emitToRoom(room, event, data) {
  if (io) io.to(room).emit(event, data);
}

function getIO() {
  return io;
}

module.exports = { setServer, emitToDashboard, emitToRoom, getIO };
