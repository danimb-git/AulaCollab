const express = require("express");
const requireAuth = require("../common/middlewares/requireAuth");

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  // req.user ve del middleware requireAuth
  res.json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = router;
