CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY,
  nom          VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  uploader_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  class_id     UUID REFERENCES classes(id)     ON DELETE CASCADE,
  group_id     UUID REFERENCES work_groups(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT documents_one_parent CHECK (
    (class_id IS NOT NULL AND group_id IS NULL)
    OR
    (class_id IS NULL AND group_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_documents_class ON documents(class_id);
CREATE INDEX IF NOT EXISTS idx_documents_group ON documents(group_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploader_id);
