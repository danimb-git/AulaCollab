const express = require("express");
const classesController = require("../modules/classes/classes.controller");
const requireAuth = require("../common/middlewares/requireAuth");
const requireRole = require("../common/middlewares/requireRole");

const router = express.Router();

// POST /api/classes (crear classe) - només PROFESSOR (teacher)
router.post(
  "/",
  requireAuth,
  requireRole("PROFESSOR"),
  classesController.createClass
);

// 🔵 REAL: GET /api/classes (BD real, segons usuari)
router.get(
  "/",
  requireAuth,
  classesController.listClassesForUser
);

// 🔵 REAL: GET /api/classes/:id (detall + membres)
router.get(
  "/:id",
  requireAuth,
  classesController.getClassDetail
);

// 🔵 REAL: POST /api/classes/:id/members (afegir membres per email)
router.post(
  "/:id/members",
  requireAuth,
  requireRole("PROFESSOR"),
  classesController.addMembersByEmail
);

// 🔵 REAL: DELETE /api/classes/:id/members/:userId
router.delete(
  "/:id/members/:userId",
  requireAuth,
  requireRole("PROFESSOR"),
  classesController.removeMember
);

// POST /api/classes/:id/leave (ALUMNE abandona la classe; també permet a qualsevol membre no-owner marxar)
router.post("/:id/leave", requireAuth, classesController.leaveClass);

module.exports = router;
