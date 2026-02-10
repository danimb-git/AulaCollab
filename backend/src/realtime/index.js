const { verifyAccessToken } = require("../config/jwt");
const registerWebRTCHandlers = require("./webrtc");

// Inicialitza els handlers de WebRTC sobre una instància ja creada de Socket.IO
function initRealtime(io) {
  // autenticació de l'usuari en la connexió
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("NO_TOKEN");

      const payload = verifyAccessToken(token);

      socket.data.userId = payload.sub;
      socket.data.role = payload.role ?? payload.rol;

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
