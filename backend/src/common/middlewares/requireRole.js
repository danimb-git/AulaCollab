function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // 1) Assegurem que requireAuth s'ha executat abans
    if (!req.user || !req.user.role) {
      return res.status(401).json({ ok: false, error: "Unauthenticated" });
    }

    // 2) Comprovem el rol
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden",
        allowedRoles,
        yourRole: userRole,
      });
    }

    // 3) Deixar passar
    return next();
  };
}

module.exports = requireRole;
