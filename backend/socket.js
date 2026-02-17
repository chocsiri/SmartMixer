const { Server } = require("socket.io");

let io;

function init(server) {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Frontend Connected:", socket.id);
  });

  return io;
}

module.exports = {
  init,
  get io() {
    return io;
  },
};
