require("dotenv").config();
const env = require("./config/env");
const app = require("./app");
const http = require("http");
const { initSocket } = require("./socket");

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
