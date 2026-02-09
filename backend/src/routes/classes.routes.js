const express = require("express");
const classesController = require("../modules/classes/classes.controller");
const documentsController = require("../modules/documents/documents.controller");
const requireAuth = require("../common/middlewares/requireAuth");
const requireRole = require("../common/middlewares/requireRole");
const { createUpload } = require("../common/middlewares/upload");

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

// Documents (classes)
const classUpload = createUpload("classes");

// POST /api/classes/:id/documents (només admin o professor propietari)
router.post(
  "/:id/documents",
  requireAuth,
  classUpload.single("file"),
  documentsController.uploadForClass
);

// GET /api/classes/:id/documents (admin, professor propietari o alumne membre)
router.get(
  "/:id/documents",
  requireAuth,
  documentsController.listClassDocuments
);

// GET /api/classes/:id/documents/:docId/download
router.get(
  "/:id/documents/:docId/download",
  requireAuth,
  documentsController.downloadClassDocument
);

module.exports = router;
