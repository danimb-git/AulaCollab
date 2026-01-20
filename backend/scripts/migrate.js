require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("../src/db/pool");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function hasMigration(filename) {
  const res = await pool.query(
    "SELECT 1 FROM schema_migrations WHERE filename = $1",
    [filename]
  );
  return res.rowCount > 0;
}

async function markMigration(filename) {
  await pool.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [
    filename,
  ]);
}

async function run() {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await ensureMigrationsTable();

  for (const file of files) {
    if (await hasMigration(file)) {
      console.log(`↪️  Skip ${file}`);
      continue;
    }

    console.log(`▶️  Apply ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      await markMigration(file);
      console.log(`✅ Done ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`❌ Error ${file}:`, err.message);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  await pool.end();
}

run();
