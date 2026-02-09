const prisma = require("../db/prisma");

// Genera un nom de sala únic basat en el context (classe o grup) i l'identificador
function roomName(context, id) {
  if (context === "class") return `call:class:${id}`;
  if (context === "group") return `call:group:${id}`;
  throw new Error("INVALID_CONTEXT");
}
// Obté la llista d'usuaris membres de la classe o grup per a invitacions i validacions
async function getMembers(context, id) {
  if (context === "class") {
    const rows = await prisma.class_members.findMany({
      where: { class_id: id },
      select: { user_id: true },
    });
    return rows.map((r) => r.user_id);
  }

  if (context === "group") {
    const rows = await prisma.group_members.findMany({
      where: { group_id: id },
      select: { user_id: true },
    });
    return rows.map((r) => r.user_id);
  }

  throw new Error("INVALID_CONTEXT");
}
// Comprova que l'usuari és membre de la classe o grup abans de permetre accions relacionades amb trucades
async function assertMembership(userId, context, id) {
  if (context === "class") {
    const member = await prisma.class_members.findUnique({
      where: {
        class_id_user_id: {
          class_id: id,
          user_id: userId,
        },
      },
    });
    if (!member) throw new Error("NOT_IN_CLASS");
  }

  if (context === "group") {
    const member = await prisma.group_members.findUnique({
      where: {
        group_id_user_id: {
          group_id: id,
          user_id: userId,
        },
      },
    });
    if (!member) throw new Error("NOT_IN_GROUP");
  }
}

module.exports = function registerWebRTCHandlers(io, socket) {
  const userId = socket.data.userId;

  // iniciar trucada
  socket.on("call_start", async ({ context, id, participants }) => {
    try {
      if (!context || !id) throw new Error("MISSING_CONTEXT_OR_ID");
      await assertMembership(userId, context, id);

      const room = roomName(context, id);
      socket.join(room);

      const memberIds = await getMembers(context, id);

      if (context === "class") {
        // convidem a tothom menys el que inicia
        const targets = memberIds.filter((uid) => uid !== userId);

        for (const targetId of targets) {
          io.to(`user:${targetId}`).emit("call_invite", {
            context,
            id,
            room,
            fromUserId: userId,
          });
        }

        socket.to(room).emit("call_started", { room, fromUserId: userId });
        return;
      }

      if (context === "group") {
        const list = Array.isArray(participants) ? participants : [];
        if (list.length === 0) throw new Error("MISSING_PARTICIPANTS");

        
        const cleaned = [...new Set(list)].filter((pid) => pid && pid !== userId);

        const memberSet = new Set(memberIds);
        
        for (const pid of cleaned) {
          if (!memberSet.has(pid)) throw new Error("INVITED_NOT_IN_GROUP");
        }

        for (const targetId of cleaned) {
          io.to(`user:${targetId}`).emit("call_invite", {
            context,
            id,
            room,
            fromUserId: userId,
          });
        }

        socket.to(room).emit("call_started", { room, fromUserId: userId });
        return;
      }
    } catch (err) {
      socket.emit("call_error", err.message);
    }
  });

  // unir-se a trucada existent
  socket.on("call_join", async ({ context, id, callerUserId }) => {
    try {
      if (!context || !id || !callerUserId) throw new Error("MISSING_DATA");
      await assertMembership(userId, context, id);

      const room = roomName(context, id);
      socket.join(room);

      io.to(`user:${callerUserId}`).emit("call_joined", {
        context,
        id,
        fromUserId: userId,
      });
    } catch (err) {
      socket.emit("call_error", err.message);
    }
  });

  // ofertar trucada
  socket.on("webrtc_offer", async ({ context, id, targetUserId, sdp }) => {
    try {
      if (!context || !id || !targetUserId) throw new Error("MISSING_DATA");
      await assertMembership(userId, context, id);

      console.log("📡 webrtc_offer enviant a:", `user:${targetUserId}`);
      console.log("   des de user:", userId);

      io.to(`user:${targetUserId}`).emit("webrtc_offer", {
        fromUserId: userId,
        sdp,
      });
    } catch (err) {
      socket.emit("call_error", err.message);
    }
  });

  // respondre trucada
  socket.on("webrtc_answer", async ({ context, id, targetUserId, sdp }) => {
    try {
      if (!context || !id || !targetUserId) throw new Error("MISSING_DATA");
      await assertMembership(userId, context, id);

      io.to(`user:${targetUserId}`).emit("webrtc_answer", {
        fromUserId: userId,
        sdp,
      });
    } catch (err) {
      socket.emit("call_error", err.message);
    }
  });

  // intercanviar ICE candidates
  socket.on("webrtc_ice_candidate", async ({ context, id, targetUserId, candidate }) => {
    try {
      if (!context || !id || !targetUserId || !candidate) throw new Error("MISSING_DATA");
      await assertMembership(userId, context, id);

      io.to(`user:${targetUserId}`).emit("webrtc_ice_candidate", {
        fromUserId: userId,
        candidate,
      });
    } catch (err) {
      socket.emit("call_error", err.message);
    }
  });

  // finalitzar trucada
  socket.on("call_end", ({ context, id }) => {
    const room = roomName(context, id);
    socket.leave(room);

    socket.to(room).emit("call_ended", {
      room,
      fromUserId: userId,
    });
  });
};
