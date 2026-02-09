const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("🟢 Connected as client:", socket.id);
  socket.disconnect();
});

socket.on("connect_error", (err) => {
  console.error("🔴 connect_error:", err.message);
});
