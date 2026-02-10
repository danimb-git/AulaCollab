require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const env = require("./config/env");
const app = require("./app");

const initSocket = require("./socket");
const initRealtime = require("./realtime");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

initSocket(io);
initRealtime(io);

server.listen(env.PORT, () => {
  console.log(`✅ Backend + Socket.io running on http://localhost:${env.PORT}`);
});
