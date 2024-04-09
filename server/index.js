const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();

// Socket io using an express app instead of an http app (interesting)
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

let players = {};

io.on("connection", (socket) => {
  // let socket know list of all online boxes
  console.log("connected: ", socket.id);

  //send friends to self
  socket.emit("current players", players);

  //create box for user
  const player = {
    x: Math.floor(Math.random() * 15) - 7,
    z: Math.floor(Math.random() * 15) - 7,
  };
  players[socket.id] = player;
  //send self box to others
  socket.broadcast.emit("friend joined", socket.id, player);

  //send self box to self
  socket.emit("create character", player);
  // roomHandler(io, socket, rooms);

  socket.on("object move", (x, z) => {
    players[socket.id] = { x, z };
    socket.broadcast.emit("box moved", socket.id, { x, z });
  });

  socket.on("disconnect", () => {
    console.log("disconnected", socket.id);
    delete players[socket.id];
    socket.broadcast.emit("friend left", socket.id);
  });
});

const port = process.env.PORT || 8080;
httpServer.listen(port, () => console.log(`Listening on port ${port}`));
