const express = require("express");
const classesController = require("../modules/classes/classes.controller");
const documentsController = require("../modules/documents/documents.controller");
const requireAuth = require("../common/middlewares/requireAuth");
const requireRole = require("../common/middlewares/requireRole");
const { createUpload } = require("../common/middlewares/upload");

const router = express.Router();

/* =========================
   ✅ DUMMY (per proves)
   (abans de /:id per no conflictes)
========================= */

// ✅ GET /api/classes/classes  -> llista de classes (dummy)
router.get("/classes", (req, res) => {
  res.json([
    { id: 1, name: "Biologia" },
    { id: 2, name: "Programació" },
  ]);
});

// ✅ GET /api/classes/classes/:id -> detall + membres (dummy)
router.get("/classes/:id", (req, res) => {
  const id = Number(req.params.id);

  res.json({
    id,
    name: id === 1 ? "Biologia" : "Programació",
    role: "PROFESSOR",
    members: [
      { id: 10, email: "profe@demo.com", role: "PROFESSOR" },
      { id: 11, email: "alumne@demo.com", role: "ALUMNE" },
    ],
  });
});

// ✅ POST /api/classes/classes/:id/members -> afegir membres (dummy)
router.post("/classes/:id/members", (req, res) => {
  const classId = Number(req.params.id);
  const emails = Array.isArray(req.body?.emails) ? req.body.emails : [];

  const added = [];
  const alreadyMembers = [];
  const notFound = [];

  for (const email of emails) {
    if (!email || typeof email !== "string") continue;

    const e = email.trim().toLowerCase();
    if (e.includes("old")) alreadyMembers.push(e);
    else if (e.includes("no") || e.includes("404")) notFound.push(e);
    else added.push(e);
  }

  return res.json({
    classId,
    added,
    alreadyMembers,
    notFound,
  });
});

/* =========================
   🔵 REAL (BD)
========================= */

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
