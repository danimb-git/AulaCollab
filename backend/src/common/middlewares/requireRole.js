const { unauthorized, forbidden } = require("../utils/apiError");

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // 1) requireAuth ha d’haver posat req.user
    if (!req.user || !req.user.role) {
      return next(unauthorized("AUTH_REQUIRED", "Unauthenticated"));
    }

    // 2) Comprovar rol
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        forbidden("ROLE_REQUIRED", "You do not have permission for this action", {
          allowedRoles,
          yourRole: userRole,
        })
      );
    }

    // 3) OK
    return next();
  };
}

module.exports = requireRole;
