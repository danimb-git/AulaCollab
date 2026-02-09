-- Extensiones para clases, class_members, work_groups y group_members
-- Añade campos necesarios para roles de miembros y ownership de grupos

-- Campo opcional para rol dentro de la clase (permite PATCH de miembro)
ALTER TABLE class_members
  ADD COLUMN IF NOT EXISTS role_in_class VARCHAR(50);

-- Campos extra para work_groups: descripción, owner y clase asociada opcional
ALTER TABLE work_groups
  ADD COLUMN IF NOT EXISTS descripcio TEXT,
  ADD COLUMN IF NOT EXISTS owner_id UUID,
  ADD COLUMN IF NOT EXISTS class_id UUID;

-- FK y índices para owner_id y class_id (idempotentes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints
    WHERE  table_name = 'work_groups'
    AND    constraint_name = 'fk_work_groups_owner'
  ) THEN
    ALTER TABLE work_groups
      ADD CONSTRAINT fk_work_groups_owner
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints
    WHERE  table_name = 'work_groups'
    AND    constraint_name = 'fk_work_groups_class'
  ) THEN
    ALTER TABLE work_groups
      ADD CONSTRAINT fk_work_groups_class
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_work_groups_owner ON work_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_work_groups_class ON work_groups(class_id);

-- Campo opcional para rol dentro del grupo (permite PATCH de miembro)
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS member_role VARCHAR(50);

