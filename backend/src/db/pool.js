const { Pool } = require("pg");

// Connexió local (Postgres del docker-compose, perquè exposes 5432:5432)
const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "aulacollab",
  user: "aulacollab_admin",
  password: "Password1",
});

module.exports = pool;
