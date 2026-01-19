const express = require("express");
const healthRoutes = require("./routes/health.routes");
const dbHealthRoutes = require("./routes/dbHealth.routes");

const app = express();
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", dbHealthRoutes);

module.exports = app;
