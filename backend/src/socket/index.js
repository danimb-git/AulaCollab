const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

async function canJoinClass(userId, classId) {
  // professor o membre
  const prof = await pool.query(
    `SELECT 1 FROM classes WHERE id = $1 AND professor_id = $2 LIMIT 1`,
    [classId, userId],
  );
  if (prof.rowCount > 0) return true;

  const mem = await pool.query(
    `SELECT 1 FROM class_members WHERE class_id = $1 AND user_id = $2 LIMIT 1`,
    [classId, userId],
  );
  return mem.rowCount > 0;
}

async function canJoinGroup(userId, groupId) {
  const mem = await pool.query(
    `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 LIMIT 1`,
    [groupId, userId],
  );
  return mem.rowCount > 0;
}

function parseRoom(room) {
  if (typeof room !== "string") return null;

  if (room.startsWith("class:")) {
    const classId = room.slice("class:".length);
    return { type: "class", classId };
  }

  if (room.startsWith("group:")) {
    const groupId = room.slice("group:".length);
    return { type: "group", groupId };
  }

  if (room.startsWith("dm:")) {
    const parts = room.split(":"); // ["dm", userA, userB]
    if (parts.length !== 3) return null;
    return { type: "dm", userA: parts[1], userB: parts[2] };
  }

  return null;
}

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

    socket.on("join_room", async ({ room }, ack) => {
      try {
        // 1) Validar format bàsic
        const parsed = parseRoom(room);
        if (!parsed) {
          return ack?.({ ok: false, error: "Invalid room format" });
        }

        const userId = socket.user.id;

        // 2) Validar permisos segons tipus
        if (parsed.type === "class") {
          const ok = await canJoinClass(userId, parsed.classId);
          if (!ok) return ack?.({ ok: false, error: "Forbidden (class)" });
        }

        if (parsed.type === "group") {
          const ok = await canJoinGroup(userId, parsed.groupId);
          if (!ok) return ack?.({ ok: false, error: "Forbidden (group)" });
        }

        if (parsed.type === "dm") {
          // IMPORTANT: només poden entrar a la room els dos usuaris del DM
          if (userId !== parsed.userA && userId !== parsed.userB) {
            return ack?.({ ok: false, error: "Forbidden (dm)" });
          }
        }

        // 3) Si tot OK → join
        socket.join(room);

        // 4) Retornem OK
        return ack?.({ ok: true, room });
      } catch (err) {
        return ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("leave_room", ({ room }, ack) => {
      try {
        socket.leave(room);
        return ack?.({ ok: true, room });
      } catch (err) {
        return ack?.({ ok: false, error: err.message });
      }
    });
  });

  return io;
}

module.exports = { initSocket };
