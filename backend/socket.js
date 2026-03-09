let io = null;

function setServer(socketServer) {
  io = socketServer;
}

function emitToDashboard(event, data) {
  if (io) io.emit(event, data);
}

module.exports = { setServer, emitToDashboard };
