const { io } = require("socket.io-client");

// Posa token real de l'Usuari 1:
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGVkMDM0OC1jNjVmLTRlYTItYjMzZS1lN2JhZTc1ZDJjYTciLCJlbWFpbCI6InByb3ZhLmFsdW1uZUBhdWxhY29sbGFiLmNvbSIsInJvbGUiOiJBTFVNTkUiLCJpYXQiOjE3NzA2MjQxMTYsImV4cCI6MTc3MDYyNzcxNn0.T3MKGEuSat73ldLYO95WfXxKVUBunddvgzQBYm2CVPY";

// IDs reals:
const USER1_ID = "9ded0348-c65f-4ea2-b33e-e7bae75d2ca7";
const USER2_ID = "d00541bd-efb2-4e66-81af-0b605e1681ee";

function dmRoom(a, b) {
  const [x, y] = [a, b].sort();
  return `dm:${x}:${y}`;
}

const ROOM = dmRoom(USER1_ID, USER2_ID);

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  auth: { token: TOKEN },
});

socket.on("connect", () => {
  console.log("🟢 connected:", socket.id);

  socket.on("new_message", (msg) => {
    console.log("📩 new_message:", msg);
  });

  socket.emit("join_room", { room: ROOM }, (res) => {
    console.log("join_room ack:", res);

    socket.emit(
      "send_message",
      { contextType: "dm", receiverId: USER2_ID, text: "Hola! primer missatge per socket 💬" },
      (ack) => {
        console.log("send_message ack:", ack);
        setTimeout(() => socket.disconnect(), 500);
      }
    );
  });
});

socket.on("connect_error", (err) => {
  console.error("🔴 connect_error:", err.message);
});
