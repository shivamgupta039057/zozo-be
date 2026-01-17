-- Drop existing foreign key constraints if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_assignedTo_fkey' AND table_name = 'leads'
  ) THEN
    ALTER TABLE "leads" DROP CONSTRAINT "leads_assignedTo_fkey";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leads_created_by_fkey' AND table_name = 'leads'
  ) THEN
    ALTER TABLE "leads" DROP CONSTRAINT "leads_created_by_fkey";
  END IF;
END $$;

-- ALTER TABLE "leads"
--   ALTER COLUMN "assignedTo" DROP DEFAULT,
--   ALTER COLUMN "assignedTo" TYPE INTEGER USING NULLIF("assignedTo", '')::integer,
--   ALTER COLUMN "created_by" DROP DEFAULT,
--   ALTER COLUMN "created_by" TYPE INTEGER USING NULLIF("created_by", '')::integer;

-- Add foreign key constraints
ALTER TABLE "leads"
  ADD CONSTRAINT "leads_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "leads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
