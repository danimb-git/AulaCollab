/*
Estem assumint que el token porta: sub, email, role.

Això és el que s'haurà de fer servir quan generi el token al login.
*/

const { verifyAccessToken } = require("../../config/jwt");

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1) Existeix Authorization?
    if (!authHeader) {
      return res.status(401).json({ ok: false, error: "Missing Authorization header" });
    }

    // 2) Format "Bearer <token>"?
    const parts = authHeader.split(" ");
    const scheme = parts[0];
    const token = parts[1];

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ ok: false, error: "Invalid Authorization format" });
    }

    // 3) Verificar el token
    const payload = verifyAccessToken(token);

    // 4) Guardar l'usuari del token
    // (IMPORTANT: aquí decidim quin format volem)
    req.user = {
      id: payload.sub,        // sub = userId
      email: payload.email,
      role: payload.role,
    };

    // 5) Deixar passar
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
}

module.exports = requireAuth;
