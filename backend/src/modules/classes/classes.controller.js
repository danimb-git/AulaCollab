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

module.exports = {
  createClass,
};
