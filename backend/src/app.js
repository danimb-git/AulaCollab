const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const dbHealthRoutes = require("./routes/dbHealth.routes");
const meRoutes = require("./routes/me.routes");
const authRoutes = require("./modules/auth/auth.routes");
const errorHandler = require("./common/middlewares/errorHandler");

const classesRoutes = require("./routes/classes.routes");
const groupsRoutes = require("./routes/groups.routes");
const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", dbHealthRoutes);
app.use("/api", meRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/classes", classesRoutes);
app.use("/api/groups", groupsRoutes);

app.use(errorHandler);

module.exports = app;
