CREATE TABLE IF NOT EXISTS classes (
  id           UUID PRIMARY KEY,
  nom          VARCHAR(120) NOT NULL,
  descripcio   TEXT,
  professor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_professor ON classes(professor_id);

CREATE TABLE IF NOT EXISTS class_members (
  class_id  UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (class_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_class_members_user ON class_members(user_id);
