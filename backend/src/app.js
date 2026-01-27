const express = require("express");
const healthRoutes = require("./routes/health.routes");
const dbHealthRoutes = require("./routes/dbHealth.routes");
const meRoutes = require("./routes/me.routes");
const authRoutes = require("./modules/auth/auth.routes");
const errorHandler = require("./common/middlewares/errorHandler");

const app = express();
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", dbHealthRoutes);
app.use("/api", meRoutes);
app.use("/api/auth", authRoutes);
app.use(errorHandler);

module.exports = app;
