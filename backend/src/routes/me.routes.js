const express = require("express");
const requireAuth = require("../common/middlewares/requireAuth");

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  // req.user ve del middleware requireAuth
  res.json({
    ok: true,
    user: req.user,
  });
});

module.exports = router;
