const express = require("express");
const classesController = require("../modules/classes/classes.controller");
const requireAuth = require("../common/middlewares/requireAuth");
const requireRole = require("../common/middlewares/requireRole");

const router = express.Router();

// POST /api/classes (crear classe) - PROFESSOR o ADMIN
router.post(
  "/",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
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

// PATCH /api/classes/:id (actualitzar nom/descripcio) - owner (professor) o ADMIN
router.patch(
  "/:id",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.updateClass
);

// DELETE /api/classes/:id - owner (professor) o ADMIN
router.delete(
  "/:id",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.deleteClass
);

// 🔵 REAL: POST /api/classes/:id/members (afegir membres per email)
router.post(
  "/:id/members",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.addMembersByEmail
);

// 🔵 REAL: DELETE /api/classes/:id/members/:userId
router.delete(
  "/:id/members/:userId",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.removeMember
);

// 🔵 REAL: PATCH /api/classes/:id/members/:userId (actualitzar roleInClass)
router.patch(
  "/:id/members/:userId",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.updateMember
);

// POST /api/classes/:id/leave (ALUMNE abandona la classe; també permet a qualsevol membre no-owner marxar)
router.post("/:id/leave", requireAuth, classesController.leaveClass);

module.exports = router;
