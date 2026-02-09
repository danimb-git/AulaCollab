/*
requireEnv("...") obliga que existeixi

converteix PORT i DB_PORT a número

converteix DB_SSL a boolean (true/false)

posa valor per defecte a JWT_EXPIRES_IN
*/

function requireEnv(name) {
  const value = process.env[name];

  if (!value || String(value).trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

const env = {
  // App
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,

  // DB
  DB_HOST: requireEnv("DB_HOST"),
  DB_PORT: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  DB_NAME: requireEnv("DB_NAME"),
  DB_USER: requireEnv("DB_USER"),
  DB_PASSWORD: requireEnv("DB_PASSWORD"),
  DB_SSL: (process.env.DB_SSL || "false").toLowerCase() === "true",

  // JWT
  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",

  // Uploads
  FILE_UPLOAD_MAX_MB: process.env.FILE_UPLOAD_MAX_MB
    ? Number(process.env.FILE_UPLOAD_MAX_MB)
    : 10,
};

env.FILE_UPLOAD_MAX_BYTES = env.FILE_UPLOAD_MAX_MB * 1024 * 1024;

module.exports = env;
