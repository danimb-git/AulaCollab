const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // ✅ PAS 4: middleware d'autenticació abans de connection
  io.use((socket, next) => {
    try {
      // 1) Intentem agafar token de handshake.auth (RECOMANAT)
      let token = socket.handshake.auth?.token;

      // 2) Si no hi és, provem headers (Authorization: Bearer ...)
      if (!token) {
        const authHeader = socket.handshake.headers?.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.slice("Bearer ".length);
        }
      }

      // 3) Si encara no hi ha token → rebutjar
      if (!token) {
        return next(new Error("Missing token"));
      }

      // 4) Verificar JWT
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      // 5) Guardar usuari al socket (aquí és on després el farem servir)
      socket.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };

      // 6) OK → acceptar connexió
      return next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  // ✅ Si passa el middleware, arriba aquí
  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id, "user:", socket.user);

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = { initSocket };
