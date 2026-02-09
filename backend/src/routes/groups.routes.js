const express = require("express");
const groupsController = require("../modules/groups/groups.controller");
const requireAuth = require("../common/middlewares/requireAuth");
const requireRole = require("../common/middlewares/requireRole");

const router = express.Router();

// POST /api/groups
// Rols permesos: ALUMNE, PROFESSOR, ADMIN
router.post(
  "/",
  requireAuth,
  requireRole("ALUMNE", "PROFESSOR", "ADMIN"),
  groupsController.createGroup
);

// GET /api/groups
router.get("/", requireAuth, groupsController.listGroupsForUser);

// GET /api/groups/:id (detall + membres)
router.get("/:id", requireAuth, groupsController.getGroupDetail);

// PATCH /api/groups/:id (nom/descripcio) - només owner o ADMIN (es comprova al servei)
router.patch("/:id", requireAuth, groupsController.updateGroup);

// DELETE /api/groups/:id - només owner o ADMIN (es comprova al servei)
router.delete("/:id", requireAuth, groupsController.deleteGroup);

// POST /api/groups/:id/members
router.post("/:id/members", requireAuth, groupsController.addMember);

// DELETE /api/groups/:id/members/:userId
router.delete(
  "/:id/members/:userId",
  requireAuth,
  groupsController.removeMember
);

// PATCH /api/groups/:id/members/:userId
router.patch(
  "/:id/members/:userId",
  requireAuth,
  groupsController.updateMember
);

module.exports = router;

