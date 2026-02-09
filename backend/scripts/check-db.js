// scripts/check-db.js
require("dotenv").config();

const pool = require("../src/db/pool");

async function main() {
  const client = await pool.connect();
  try {
    console.log("✅ Connexió OK a PostgreSQL");
    console.log("   DB_HOST:", process.env.DB_HOST);
    console.log("   DB_PORT:", process.env.DB_PORT);
    console.log("   DB_NAME:", process.env.DB_NAME);
    console.log("   DB_USER:", process.env.DB_USER);
    console.log("");

    // 1) Comprovar que existeix schema_migrations i mostrar últimes migracions
    const migRes = await client.query(`
      SELECT filename, applied_at
      FROM schema_migrations
      ORDER BY applied_at DESC
      LIMIT 20;
    `);

    console.log("📌 Últimes migracions aplicades (schema_migrations):");
    if (migRes.rows.length === 0) {
      console.log("   (cap fila) → potser la taula és buida o estàs a una BD diferent.");
    } else {
      for (const row of migRes.rows) {
        console.log(`   - ${row.filename} | ${row.applied_at}`);
      }
    }
    console.log("");

    // 2) Comprovar columnes de la taula messages
    const colsRes = await client.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name='messages'
        AND column_name IN ('context_type','context_id','receiver_id')
      ORDER BY column_name;
    `);

    console.log("📌 Comprovació columnes de messages:");
    if (colsRes.rows.length === 0) {
      console.log("   ❌ No es troben les columnes context_type/context_id/receiver_id.");
      console.log("   → La migració 007 no s'ha aplicat o estàs mirant una BD equivocada.");
    } else {
      for (const row of colsRes.rows) {
        console.log(
          `   - ${row.column_name} | nullable=${row.is_nullable} | default=${row.column_default}`
        );
      }
    }

    console.log("\n✅ Check complet.");
  } catch (err) {
    console.error("❌ Error fent el check:", err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
