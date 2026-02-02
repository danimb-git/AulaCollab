const { verifyAccessToken } = require("../../config/jwt");
const { unauthorized } = require("../utils/apiError"); 

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1) Existeix Authorization?
    if (!authHeader) {
      return next(unauthorized("AUTH_REQUIRED", "Missing Authorization header"));
    }

    // 2) Format "Bearer <token>"?
    const parts = authHeader.split(" ");
    const scheme = parts[0];
    const token = parts[1];

    if (scheme !== "Bearer" || !token) {
      return next(unauthorized("AUTH_REQUIRED", "Invalid Authorization format", {
        expected: "Bearer <token>",
      }));
    }

    // 3) Verificar el token
    const payload = verifyAccessToken(token);

    // 4) Guardar l'usuari del token
    req.user = {
      id: payload.sub,   // sub = userId
      email: payload.email,
      role: payload.role,
    };

    // 5) Deixar passar
    return next();
  } catch (err) {
    return next(unauthorized("INVALID_TOKEN", "Invalid or expired token"));
  }
}

module.exports = requireAuth;
