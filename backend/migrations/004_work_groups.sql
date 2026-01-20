CREATE TABLE IF NOT EXISTS work_groups (
  id         UUID PRIMARY KEY,
  nom        VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id  UUID NOT NULL REFERENCES work_groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
