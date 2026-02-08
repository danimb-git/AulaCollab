const { io } = require("socket.io-client");

const TOKEN = "PASTE_YOUR_JWT_HERE";

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  auth: { token: TOKEN },
});

socket.on("connect", () => {
  console.log("🟢 Connected! socket.id =", socket.id);
  socket.disconnect();
});

socket.on("connect_error", (err) => {
  console.error("🔴 connect_error:", err.message);
});
