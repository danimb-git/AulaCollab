const classesService = require("./classes.service");

async function createClass(req, res) {
  try {
    const { nom, descripcio } = req.body;

    if (!nom) {
      return res.status(400).json({
        ok: false,
        error: "Field 'nom' is required",
      });
    }

    const newClass = await classesService.createClass({
      nom,
      descripcio,
      professorId: req.user.id,
    });

    return res.status(201).json({
      ok: true,
      data: newClass,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
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



module.exports = {
  createClass,
  listClassesForUser,
  getClassDetail,
  addMembersByEmail,
  removeMember,
};

