require("dotenv").config();
const http = require("http");

const env = require("./config/env");
const app = require("./app");
const http = require("http");
const { initSocket } = require("./socket");

const httpServer = http.createServer(app);
const io = initSocket(httpServer);
const initRealtime = require("./realtime"); 

// creem el servidor HTTP amb Express
const server = http.createServer(app);

// inicialitzem la part de Realtime amb Socket.io
initRealtime(server);

// posem el servidor a escoltar
server.listen(env.PORT, () => {
  console.log(`✅ Backend + Socket.io running on http://localhost:${env.PORT}`);
});
