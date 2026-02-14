const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const dbHealthRoutes = require("./routes/dbHealth.routes");
const meRoutes = require("./routes/me.routes");
const authRoutes = require("./modules/auth/auth.routes");
const errorHandler = require("./common/middlewares/errorHandler");

const classesRoutes = require("./routes/classes.routes");

const messagesRoutes = require("./routes/messages.routes");

const usersRoutes = require("./routes/users.routes");

const groupsRoutes = require("./routes/groups.routes");
const app = express();

// CORS: permet el front en desenvolupament (Vite pot canviar el port si 5173 està ocupat)
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // peticions sense Origin (curl, Postman, etc.)
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);

app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", dbHealthRoutes);
app.use("/api", meRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api", messagesRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api", usersRoutes);

// IMPORTANT: error handler must be registered after all routes
app.use(errorHandler);

module.exports = app;
