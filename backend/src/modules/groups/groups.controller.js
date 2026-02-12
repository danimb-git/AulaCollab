const groupsService = require("./groups.service");

/**
 * POST /api/groups
 * Body d'exemple (Postman):
 * {
 *   "nom": "Grup de treball 1",
 *   "descripcio": "Projecte de Node",
 *   "classId": "uuid-opcional-de-classe"
 * }
 */
async function createGroup(req, res) {
  try {
    const ownerId = req.user.id;
    const { nom, descripcio, classId } = req.body;

    if (typeof nom !== "string" || nom.trim().length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "Field 'nom' is required" });
    }

    const nomTrimmed = nom.trim();
    if (nomTrimmed.length > 120) {
      return res.status(400).json({
        ok: false,
        error: "Field 'nom' is too long (max 120)",
      });
    }

    const result = await groupsService.createGroup({
      nom: nomTrimmed,
      descripcio,
      ownerId,
      classId: typeof classId === "string" ? classId : undefined,
      user: req.user,
    });

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ ok: false, error: result.error });
    }

    return res.status(201).json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
}

// GET /api/groups
async function listGroupsForUser(req, res) {
  try {
    const result = await groupsService.listGroupsForUser({ user: req.user });
    if (!result.ok) {
      return res
        .status(result.status)
        .json({ ok: false, error: result.error });
    }
    return res.json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
}

// GET /api/groups/:id
async function getGroupDetail(req, res) {
  try {
    const groupId = req.params.id;

    const result = await groupsService.getGroupDetail({
      groupId,
      user: req.user,
    });

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
}

// PATCH /api/groups/:id
async function updateGroup(req, res) {
  try {
    const groupId = req.params.id;
    const { nom, descripcio } = req.body;

    if (nom !== undefined) {
      if (typeof nom !== "string" || nom.trim().length === 0) {
        return res.status(400).json({
          ok: false,
          error: "Field 'nom' must be a non-empty string",
        });
      }
      if (nom.trim().length > 120) {
        return res.status(400).json({
          ok: false,
          error: "Field 'nom' is too long (max 120)",
        });
      }
    }

    const result = await groupsService.updateGroup({
      groupId,
      user: req.user,
      nom: nom !== undefined ? nom.trim() : undefined,
      descripcio,
    });

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
}

// DELETE /api/groups/:id
async function deleteGroup(req, res) {
  try {
    const groupId = req.params.id;

    const result = await groupsService.deleteGroup({
      groupId,
      user: req.user,
    });

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
}

/**
 * POST /api/groups/:id/members
 * Body d'exemple:
 * { "emails": ["alumne1@example.com", "alumne2@example.com"] }
 * o individual:
 * { "email": "alumne@example.com" }
 */
async function addMember(req, res) {
  try {
    const groupId = req.params.id;
    const { email, emails, userId, memberRole } = req.body || {};

    // Support both single email and array of emails
    let emailsList = [];
    if (Array.isArray(emails) && emails.length > 0) {
      emailsList = emails.filter(e => typeof e === "string" && e.trim() !== "");
    } else if (typeof email === "string" && email.trim() !== "") {
      emailsList = [email];
    }

    if (emailsList.length === 0 && (!userId || String(userId).trim() === "")) {
      return res.status(400).json({
        ok: false,
        error: "Either 'emails' array, 'email' string, or 'userId' must be provided",
      });
    }

    // If emails provided, add each one
    if (emailsList.length > 0) {
      const results = [];
      for (const targetEmail of emailsList) {
        const result = await groupsService.addMember({
          groupId,
          user: req.user,
          targetEmail,
          targetUserId: undefined,
          memberRole:
            typeof memberRole === "string" && memberRole.trim()
              ? memberRole.trim()
              : undefined,
        });
        results.push(result);
      }

      // Check if any failed
      const failures = results.filter(r => !r.ok);
      if (failures.length > 0) {
        return res.status(400).json({
          ok: false,
          error: `Failed to add some members: ${failures.map(f => f.error).join("; ")}`,
        });
      }

      return res.json({ ok: true, data: results.map(r => r.data) });
    }

    // Otherwise use userId
    const result = await groupsService.addMember({
      groupId,
      user: req.user,
      targetEmail: undefined,
      targetUserId:
        typeof userId === "string" && userId.trim() ? userId : undefined,
      memberRole:
        typeof memberRole === "string" && memberRole.trim()
          ? memberRole.trim()
          : undefined,
    });

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
}

// DELETE /api/groups/:id/members/:userId
async function removeMember(req, res) {
  try {
    const groupId = req.params.id;
    const memberId = req.params.userId;

    const result = await groupsService.removeMember({
      groupId,
      memberId,
      user: req.user,
    });

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
}

// PATCH /api/groups/:id/members/:userId
// Body d'exemple:
// { "memberRole": "COLEADER" }
async function updateMember(req, res) {
  try {
    const groupId = req.params.id;
    const memberId = req.params.userId;
    const { memberRole } = req.body || {};

    if (typeof memberRole !== "string" || memberRole.trim().length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Field 'memberRole' must be a non-empty string",
      });
    }

    const result = await groupsService.updateMember({
      groupId,
      memberId,
      user: req.user,
      memberRole: memberRole.trim(),
    });

    if (!result.ok) {
      return res
        .status(result.status)
        .json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, error: "Internal server error" });
  }
}

module.exports = {
  createGroup,
  listGroupsForUser,
  getGroupDetail,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  updateMember,
};
