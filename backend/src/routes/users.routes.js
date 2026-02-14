const express = require("express");
const requireAuth = require("../common/middlewares/requireAuth");
const prisma = require("../db/prisma");

/**
 * users.routes.js
 *
 * Endpoint molt simple per obtenir tots els usuaris donats d'alta.
 *
 * Per què existeix?
 * - El xat DM del frontend necessita mostrar una llista d'usuaris amb qui obrir conversa.
 * - En lloc de tenir `mockChats`, el front fa un GET /api/users i pinta la llista.
 *
 * Important:
 * - Retornem només camps "segurs" (mai password_hash).
 * - És una ruta protegida: cal estar autenticat (JWT).
 */

const router = express.Router();

router.get("/users", requireAuth, async (req, res, next) => {
  try {
    // TODO: si algun dia vols restringir visibilitat (p.ex. només professors),
    // aquí és on aplicaries la lògica.

    const users = await prisma.users.findMany({
      select: {
        id: true,
        nom: true,
        cognom: true,
        email: true,
        rol: true,
        created_at: true,
      },
      orderBy: [{ nom: "asc" }, { cognom: "asc" }, { email: "asc" }],
    });

    // Normalitzem el camp de rol a `role` per consistència amb el JWT i /me.
    const result = users.map((u) => ({
      id: u.id,
      nom: u.nom,
      cognom: u.cognom,
      email: u.email,
      role: u.rol,
      createdAt: u.created_at,
    }));

    return res.json({ data: result });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
