const express = require("express");
const router = express.Router();
const pool = require("../db/pool");
const requireAuth = require("../common/middlewares/requireAuth");

// Validació simple d'UUID (per no fer suposicions)
function isUuid(v) {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v,
    )
  );
}

async function canReadClassMessages(client, userId, classId) {
  // 1) És el professor?
  const prof = await client.query(
    `SELECT 1 FROM classes WHERE id = $1 AND professor_id = $2 LIMIT 1`,
    [classId, userId],
  );
  if (prof.rowCount > 0) return true;

  // 2) És membre?
  const mem = await client.query(
    `SELECT 1 FROM class_members WHERE class_id = $1 AND user_id = $2 LIMIT 1`,
    [classId, userId],
  );
  return mem.rowCount > 0;
}

async function canReadGroupMessages(client, userId, groupId) {
  const mem = await client.query(
    `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 LIMIT 1`,
    [groupId, userId],
  );
  return mem.rowCount > 0;
}

router.get("/messages", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    // 1) Usuari loguejat
    const userId = req.user.id;

    // 2) Llegim query params
    const { contextType, contextId, receiverId, limit } = req.query;

    // 3) Validació bàsica
    if (!contextType) {
      return res
        .status(400)
        .json({ error: "contextType is required (dm|class|group)" });
    }
    if (!["dm", "class", "group"].includes(contextType)) {
      return res
        .status(400)
        .json({ error: "contextType must be dm, class, or group" });
    }

    const parsedLimit = limit ? Number(limit) : 50;
    if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 200) {
      return res
        .status(400)
        .json({ error: "limit must be a number between 1 and 200" });
    }

    // Validació segons context
    if (contextType === "dm") {
      if (!receiverId)
        return res.status(400).json({ error: "receiverId is required for dm" });
      if (!isUuid(receiverId))
        return res.status(400).json({ error: "receiverId must be a UUID" });
    } else {
      if (!contextId)
        return res
          .status(400)
          .json({ error: "contextId is required for class/group" });
      if (!isUuid(contextId))
        return res.status(400).json({ error: "contextId must be a UUID" });
    }

    // 4) Query real
    let rows = [];

    // DM: missatges entre userId i receiverId
    if (contextType === "dm") {
      const r = await client.query(
        `
        SELECT id, text,
               sender_id AS "senderId",
               receiver_id AS "receiverId",
               context_type AS "contextType",
               context_id AS "contextId",
               created_at AS "createdAt"
        FROM messages
        WHERE context_type = 'dm'
          AND (
            (sender_id = $1 AND receiver_id = $2)
            OR
            (sender_id = $2 AND receiver_id = $1)
          )
        ORDER BY created_at DESC
        LIMIT $3
        `,
        [userId, receiverId, parsedLimit],
      );

      // Retornem de més antic a més nou (més còmode pel front)
      rows = r.rows.reverse();
    }

    // Class / Group: PERMISOS + query
    if (contextType === "class" || contextType === "group") {
      // 1) Permís
      if (contextType === "class") {
        const ok = await canReadClassMessages(client, userId, contextId);
        if (!ok) {
          return res.status(403).json({
            error: "You are not allowed to read this class chat",
          });
        }
      }

      if (contextType === "group") {
        const ok = await canReadGroupMessages(client, userId, contextId);
        if (!ok) {
          return res.status(403).json({
            error: "You are not allowed to read this group chat",
          });
        }
      }

      // 2) Query historial (ara sí)
      const r = await client.query(
        `
    SELECT id, text,
           sender_id AS "senderId",
           receiver_id AS "receiverId",
           context_type AS "contextType",
           context_id AS "contextId",
           created_at AS "createdAt"
    FROM messages
    WHERE context_type = $1
      AND context_id = $2
    ORDER BY created_at DESC
    LIMIT $3
    `,
        [contextType, contextId, parsedLimit],
      );

      rows = r.rows.reverse();
    }

    return res.json({ messages: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
