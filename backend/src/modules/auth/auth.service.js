// service: on va la lògica de dades (DB).

const pool = require("../../db/pool");
const { v4: uuidv4 } = require("uuid");

/**
 * Crea un usuari nou a la BD.
 * - Genera UUID a Node (Azure no permet gen_random_uuid()).
 * - Si l'email ja existeix, llença { code: "EMAIL_EXISTS" } perquè el controller retorni 409.
 *
 * @param {Object} params
 * @param {string} params.nom
 * @param {string} params.cognom
 * @param {string} params.email
 * @param {string} params.passwordHash
 * @param {string} params.rol  ("ALUMNE" | "PROFESSOR" | "ADMIN")
 */
async function createUser({ nom, cognom, email, passwordHash, rol }) {
  const id = uuidv4();

  try {
    const result = await pool.query(
      `
      INSERT INTO users (id, nom, cognom, email, password_hash, rol)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nom, cognom, email, rol, created_at;
      `,
      [id, nom, cognom, email, passwordHash, rol]
    );

    return result.rows[0];
  } catch (err) {
    // 23505 = unique_violation (normalment per email duplicat)
    if (err && err.code === "23505") {
      throw { code: "EMAIL_EXISTS" };
    }
    throw err;
  }
}

/**
 * Busca un usuari per email.
 * Necessitem retornar password_hash per poder comparar al login.
 *
 * @param {string} email
 * @returns {Object|null}
 */
async function getUserByEmail(email) {
  const result = await pool.query(
    `
    SELECT id, nom, cognom, email, rol, password_hash, created_at
    FROM users
    WHERE email = $1
    LIMIT 1;
    `,
    [email]
  );

  return result.rows[0] || null;
}

module.exports = {
  createUser,
  getUserByEmail,
};