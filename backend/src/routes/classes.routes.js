const express = require("express");
const classesController = require("../modules/classes/classes.controller");
const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");

const router = express.Router();

// POST /api/classes
router.post(
  "/",
  requireAuth,
  requireRole("PROFESSOR", "ADMIN"),
  classesController.createClass
);

// ✅ GET /api/classes  -> llista de classes (dummy)
router.get("/classes", (req, res) => {
  res.json([
    { id: 1, name: "Biologia" },
    { id: 2, name: "Programació" },
  ]);
});

// ✅ GET /api/classes/:id -> detall + membres (dummy)
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

// ✅ POST /api/classes/:id/members -> afegir membres per email (dummy)
router.post("/classes/:id/members", (req, res) => {
  const classId = Number(req.params.id);

  // Esperem { emails: ["a@a.com", "b@b.com"] }
  const emails = Array.isArray(req.body?.emails) ? req.body.emails : [];

  // DUMMY RULES:
  // - si conté "old" -> ja era membre
  // - si conté "no" o "404" -> no trobat
  // - la resta -> afegit
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

module.exports = router;
