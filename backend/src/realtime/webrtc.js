const prisma = require("../db/prisma");

function roomName(context, id) {
  if (context === "class") return `call:class:${id}`;
  if (context === "group") return `call:group:${id}`;
  throw new Error("INVALID_CONTEXT");
}

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
  socket.on("call_start", async ({ context, id }) => {
    try {
      await assertMembership(userId, context, id);

      const room = roomName(context, id);
      socket.join(room);

      socket.to(room).emit("call_started", {
        room,
        fromUserId: userId,
      });
    } catch (err) {
      socket.emit("call_error", err.message);
    }
  });

  // ofertar trucada
  socket.on("webrtc_offer", async ({ context, id, targetUserId, sdp }) => {
    try {
      await assertMembership(userId, context, id);

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
  socket.on(
    "webrtc_ice_candidate",
    async ({ context, id, targetUserId, candidate }) => {
      try {
        await assertMembership(userId, context, id);

        io.to(`user:${targetUserId}`).emit("webrtc_ice_candidate", {
          fromUserId: userId,
          candidate,
        });
      } catch (err) {
        socket.emit("call_error", err.message);
      }
    }
  );

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
