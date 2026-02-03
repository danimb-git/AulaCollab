const { Server } = require("socket.io");
const { verifyAccessToken } = require("../config/jwt");
const registerWebRTCHandlers = require("./webrtc");

function initRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // canvia-ho per la URL del teu frontend en producció
    },
  });

  // autenticació de l'usuari en la connexió
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("NO_TOKEN");

      const payload = verifyAccessToken(token);

      socket.data.userId = payload.sub;
      socket.data.role = payload.rol;

      next();
    } catch (err) {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    console.log("Socket connected:", userId);

    // Room privada per usuari (important per WebRTC)
    socket.join(`user:${userId}`);

    // Registrar handlers de WebRTC
    registerWebRTCHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", userId);
    });
  });

  return io;
}

module.exports = initRealtime;
