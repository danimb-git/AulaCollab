const express = require("express");
const classesController = require("../modules/classes/classes.controller");
const requireAuth = require("../common/middlewares/requireAuth");
const requireRole = require("../common/middlewares/requireRole");

const router = express.Router();

// POST /api/classes
router.post(
  "/",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.createClass
);

// GET /api/classes (segons usuari)
router.get("/", requireAuth, classesController.listClassesForUser);

// GET /api/classes/:id (detall + membres)
router.get("/:id", requireAuth, classesController.getClassDetail);

// POST /api/classes/:id/members
router.post(
  "/:id/members",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.addMembersByEmail
);

// DELETE /api/classes/:id/members/:userId
router.delete(
  "/:id/members/:userId",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.removeMember
);

// POST /api/classes/:id/leave (ALUMNE abandona la classe)
router.post("/:id/leave", requireAuth, classesController.leaveClass);

module.exports = router;
