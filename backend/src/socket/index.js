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

function validateText(text) {
  if (typeof text !== "string") return "text must be a string";
  const trimmed = text.trim();
  if (!trimmed) return "text cannot be empty";
  if (trimmed.length > 1000) return "text too long (max 1000)";
  return null;
}

function dmRoom(userA, userB) {
  const [a, b] = [userA, userB].sort(); // ordena strings
  return `dm:${a}:${b}`;
}

function roomFromContext({ contextType, contextId, senderId, receiverId }) {
  if (contextType === "class") return `class:${contextId}`;
  if (contextType === "group") return `group:${contextId}`;
  if (contextType === "dm") return dmRoom(senderId, receiverId);
  return null;
}

async function userExists(userId) {
  const r = await pool.query(`SELECT 1 FROM users WHERE id = $1 LIMIT 1`, [
    userId,
  ]);
  return r.rowCount > 0;
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
      console.log("🟡 TOKEN:", token);
      console.log("🟡 handshake.auth:", socket.handshake.auth);
      console.log("🟡 token present?", !!token);

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
      console.log("🟢 JWT PAYLOAD REAL:", payload);

      // 5) Guardar usuari al socket
      const userId = payload.sub || payload.id || payload.userId;

      if (!userId) {
        return next(new Error("Invalid token payload (missing user id)"));
      }

      socket.user = {
        id: userId,
        email: payload.email,
        role: payload.role,
      };

      console.log("🟢 socket.user:", socket.user);

      // 6) OK → acceptar connexió
      return next();
    } catch (err) {
      console.log("🔴 auth error:", err.message);
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

    socket.on("send_message", async (payload, ack) => {
      try {
        const senderId = socket.user.id;

        // 1) Llegir camps
        const { contextType, contextId, receiverId, text } = payload || {};

        // 2) Validacions bàsiques
        if (!contextType || !["dm", "class", "group"].includes(contextType)) {
          return ack?.({
            ok: false,
            error: "contextType must be dm, class, or group",
          });
        }

        const textErr = validateText(text);
        if (textErr) return ack?.({ ok: false, error: textErr });

        if (contextType === "dm") {
          if (!receiverId)
            return ack?.({ ok: false, error: "receiverId is required for dm" });
          // opcional: validar UUID si teniu funció isUuid
          const exists = await userExists(receiverId);
          if (!exists)
            return ack?.({ ok: false, error: "receiverId not found" });
          if (receiverId === senderId)
            return ack?.({ ok: false, error: "cannot DM yourself" });
        } else {
          if (!contextId)
            return ack?.({
              ok: false,
              error: "contextId is required for class/group",
            });
        }

        // 3) Validació de permisos
        if (contextType === "class") {
          const ok = await canJoinClass(senderId, contextId);
          if (!ok) return ack?.({ ok: false, error: "Forbidden (class)" });
        }

        if (contextType === "group") {
          const ok = await canJoinGroup(senderId, contextId);
          if (!ok) return ack?.({ ok: false, error: "Forbidden (group)" });
        }

        // DM: permís implícit si receiver existeix

        // 4) Persistència a BD (INSERT)
        const insert = await pool.query(
          `
      INSERT INTO messages (text, sender_id, receiver_id, context_type, context_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id, text,
        sender_id AS "senderId",
        receiver_id AS "receiverId",
        context_type AS "contextType",
        context_id AS "contextId",
        created_at AS "createdAt"
      `,
          [
            text.trim(),
            senderId,
            contextType === "dm" ? receiverId : null,
            contextType,
            contextType === "dm" ? null : contextId,
          ],
        );

        const messageSaved = insert.rows[0];

        // 5) Room correcta
        const room = roomFromContext({
          contextType,
          contextId,
          senderId,
          receiverId,
        });

        if (!room) return ack?.({ ok: false, error: "Could not build room" });

        // 6) Emitim a la room
        // IMPORTANT: els clients han d'haver fet join_room abans si volen rebre-ho
        io.to(room).emit("new_message", messageSaved);

        // 7) ACK al sender
        return ack?.({ ok: true, message: messageSaved, room });
      } catch (err) {
        return ack?.({ ok: false, error: err.message });
      }
    });
  });

  return io;
}

module.exports = { initSocket };
