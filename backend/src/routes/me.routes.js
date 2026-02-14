const express = require("express");
const requireAuth = require("../common/middlewares/requireAuth");
const prisma = require("../db/prisma");

const router = express.Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    // req.user ve del middleware requireAuth (té id/email/role del JWT)
    // Però el JWT no té per què contenir el nom. El carreguem de la BD.
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        nom: true,
        cognom: true,
        rol: true,
      },
    });

    // Fallback si no trobem usuari (o hi ha un problema de BD)
    if (!user) {
      return res.json({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      });
    }

    return res.json({
      id: user.id,
      email: user.email,
      nom: user.nom,
      cognom: user.cognom,
      // Prioritzem role del token, però si no hi és, fem servir el de la BD.
      role: req.user.role ?? user.rol,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
