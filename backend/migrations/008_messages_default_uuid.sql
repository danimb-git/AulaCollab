-- 008_messages_default_uuid.sql
-- Fa que la columna messages.id es generi automàticament

BEGIN;

-- Activa extensió per UUID (si no existeix)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Posar DEFAULT per id
ALTER TABLE messages
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

COMMIT;
