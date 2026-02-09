const express = require("express");
const requireAuth = require("../common/middlewares/requireAuth");
const { createUpload } = require("../common/middlewares/upload");
const documentsController = require("../modules/documents/documents.controller");

const router = express.Router();

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
