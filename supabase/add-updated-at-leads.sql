-- Add updated_at to admin_leads with auto-update trigger
-- Back-fill uses created_at so existing rows don't all show today's date

ALTER TABLE admin_leads
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Back-fill: copy created_at into updated_at for all existing rows
UPDATE admin_leads SET updated_at = created_at;

-- Now set default for future inserts
ALTER TABLE admin_leads
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Trigger function (reuse if already exists)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to admin_leads
DROP TRIGGER IF EXISTS trg_admin_leads_updated_at ON admin_leads;
CREATE TRIGGER trg_admin_leads_updated_at
  BEFORE UPDATE ON admin_leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
