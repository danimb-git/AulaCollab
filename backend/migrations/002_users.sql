CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY,
  nom           VARCHAR(80)  NOT NULL,
  cognom        VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol           user_role NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
