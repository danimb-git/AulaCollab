-- 007_messages_context.sql
-- Amplia la taula messages per suportar DM + Class + Group amb un sol model.

BEGIN;

-- 1) Afegim camps de context
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS context_type TEXT NOT NULL DEFAULT 'dm',
  ADD COLUMN IF NOT EXISTS context_id UUID NULL;

-- 2) receiver_id passa a ser nullable (per Class/Group)
ALTER TABLE messages
  ALTER COLUMN receiver_id DROP NOT NULL;

-- 3) Constraint: valors permesos de context_type
ALTER TABLE messages
  ADD CONSTRAINT chk_messages_context_type
  CHECK (context_type IN ('dm', 'class', 'group'));

-- 4) Constraint: coherència segons el context
-- DM: receiver_id obligatori, context_id NULL
-- CLASS/GROUP: context_id obligatori, receiver_id NULL
ALTER TABLE messages
  ADD CONSTRAINT chk_messages_context_coherence
  CHECK (
    (context_type = 'dm'    AND receiver_id IS NOT NULL AND context_id IS NULL) OR
    (context_type = 'class' AND receiver_id IS NULL     AND context_id IS NOT NULL) OR
    (context_type = 'group' AND receiver_id IS NULL     AND context_id IS NOT NULL)
  );

-- 5) Índexos recomanats per historial ràpid
-- (A) Històric de Class/Group
CREATE INDEX IF NOT EXISTS idx_messages_context_time
  ON messages (context_type, context_id, created_at);

-- (B) DM: buscar ràpid per receiver
CREATE INDEX IF NOT EXISTS idx_messages_receiver
  ON messages(receiver_id);

-- (C) sender ja el teniu, però el deixem per seguretat si no existís
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id);

-- (D) created_at (ja el teniu, però idem)
CREATE INDEX IF NOT EXISTS idx_messages_time
  ON messages(created_at);

COMMIT;
