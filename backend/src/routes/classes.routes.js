const express = require("express");
const classesController = require("../modules/classes/classes.controller");
const requireAuth = require("../common/middlewares/requireAuth");
const requireRole = require("../common/middlewares/requireRole");

const router = express.Router();

// POST /api/classes (crear classe)
router.post(
  "/",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.createClass
);

// GET /api/classes (llistar classes on sóc membre)
router.get(
  "/",
  requireAuth,
  classesController.listMyClasses
);

// GET /api/classes/:id (detall + membres + rol meu)
router.get(
  "/:id",
  requireAuth,
  classesController.getClassDetail
);

// POST /api/classes/:id/members (afegir membres per email)
router.post(
  "/:id/members",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.addMembersByEmail
);

module.exports = router;
