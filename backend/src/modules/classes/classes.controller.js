const classesService = require("./classes.service");

async function createClass(req, res) {
  try {
    const professorId = req.user.id;
    const { nom, descripcio } = req.body;

    if (typeof nom !== "string" || nom.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "Field 'nom' is required" });
    }

    const nomTrimmed = nom.trim();

    if (nomTrimmed.length > 120) {
      return res.status(400).json({ ok: false, error: "Field 'nom' is too long (max 120)" });
    }

    const newClass = await classesService.createClass({
      nom: nomTrimmed,
      descripcio: typeof descripcio === "string" ? descripcio : null,
      professorId,
    });
    return res.status(201).json({ ok: true, data: newClass });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

// PATCH /api/classes/:id
// Body d'exemple (Postman):
// { "nom": "Nou nom", "descripcio": "Nova descripció" }
async function updateClass(req, res) {
  try {
    const classId = req.params.id;
    const { nom, descripcio } = req.body;

    if (nom !== undefined) {
      if (typeof nom !== "string" || nom.trim().length === 0) {
        return res
          .status(400)
          .json({ ok: false, error: "Field 'nom' must be a non-empty string" });
      }
      if (nom.trim().length > 120) {
        return res.status(400).json({
          ok: false,
          error: "Field 'nom' is too long (max 120)",
        });
      }
    }

    const result = await classesService.updateClass({
      classId,
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

// DELETE /api/classes/:id
async function deleteClass(req, res) {
  try {
    const classId = req.params.id;

    const result = await classesService.deleteClass({
      classId,
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

async function listClassesForUser(req, res) {
  try {
    const classes = await classesService.listClassesForUser({
      user: req.user,
    });

    return res.json({
      ok: true,
      data: classes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

async function getClassDetail(req, res) {
  try {
    const classId = req.params.id;

    const result = await classesService.getClassDetail({
      classId,
      user: req.user,
    });

    if (!result.ok) {
      return res.status(result.status).json({
        ok: false,
        error: result.error,
      });
    }

    return res.json({
      ok: true,
      data: result.data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}

async function addMembersByEmail(req, res) {
  try {
    const classId = req.params.id;
    const emails = Array.isArray(req.body?.emails) ? req.body.emails : [];

    if (emails.length === 0) {
      return res.status(400).json({ ok: false, error: "Field 'emails' must be a non-empty array" });
    }

    const result = await classesService.addMembersByEmail({
      classId,
      emails,
      user: req.user,
    });

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

async function leaveClass(req, res) {
  try {
    const classId = req.params.id;

    const result = await classesService.leaveClass({
      classId,
      user: req.user,
    });

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

async function removeMember(req, res) {
  try {
    const classId = req.params.id;
    const memberId = req.params.userId;

    const result = await classesService.removeMember({
      classId,
      memberId,
      user: req.user,
    });

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

// PATCH /api/classes/:id/members/:userId
// Body d'exemple:
// { "roleInClass": "ASSISTANT" }
async function updateMember(req, res) {
  try {
    const classId = req.params.id;
    const memberId = req.params.userId;
    const { roleInClass } = req.body || {};

    if (typeof roleInClass !== "string" || roleInClass.trim().length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Field 'roleInClass' must be a non-empty string",
      });
    }

    const result = await classesService.updateMember({
      classId,
      memberId,
      user: req.user,
      roleInClass: roleInClass.trim(),
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
  createClass,
  listClassesForUser,
  getClassDetail,
  addMembersByEmail,
  removeMember,
  leaveClass,
  updateClass,
  deleteClass,
  updateMember,
};

