const express = require("express");
const requireAuth = require("../common/middlewares/requireAuth");
const groupsController = require("../modules/groups/groups.controller");
const { createUpload } = require("../common/middlewares/upload");
const documentsController = require("../modules/documents/documents.controller");

const router = express.Router();

// CRUD (groups)
router.post("/", requireAuth, groupsController.createGroup);
router.get("/", requireAuth, groupsController.listGroupsForUser);
router.get("/:id", requireAuth, groupsController.getGroupDetail);
router.patch("/:id", requireAuth, groupsController.updateGroup);
router.delete("/:id", requireAuth, groupsController.deleteGroup);
router.post("/:id/members", requireAuth, groupsController.addMember);
router.delete("/:id/members/:userId", requireAuth, groupsController.removeMember);
router.patch("/:id/members/:userId", requireAuth, groupsController.updateMember);

// Documents (groups)
const groupUpload = createUpload("groups");

// POST /api/groups/:id/documents (admin o membre del grup)
router.post(
  "/:id/documents",
  requireAuth,
  groupUpload.single("file"),
  documentsController.uploadForGroup
);

// GET /api/groups/:id/documents
router.get(
  "/:id/documents",
  requireAuth,
  documentsController.listGroupDocuments
);

// GET /api/groups/:id/documents/:docId/download
router.get(
  "/:id/documents/:docId/download",
  requireAuth,
  documentsController.downloadGroupDocument
);

module.exports = router;
