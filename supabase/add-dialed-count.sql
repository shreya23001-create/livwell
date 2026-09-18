-- Add dialed_count column to admin_leads
-- Tracks how many times an agent has dialed a lead

ALTER TABLE admin_leads
  ADD COLUMN IF NOT EXISTS dialed_count INT DEFAULT 0;
