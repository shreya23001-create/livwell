-- Run this in Supabase SQL Editor AFTER deploying the edge function
-- Replace YOUR_PROJECT_REF with your actual Supabase project ref (e.g. abcdefghijklmnop)
-- Replace YOUR_ANON_KEY with your Supabase anon/service key

-- Enable pg_cron extension (if not already enabled)
create extension if not exists pg_cron;

-- Schedule the edge function to run every 5 minutes
-- This checks for events starting in ~1 hour and sends email reminders
select cron.schedule(
  'send-event-reminders',           -- job name
  '*/5 * * * *',                    -- every 5 minutes
  $$
  select net.http_post(
    url     := 'https://xlzhdocpfrjcrcakiqtg.supabase.co/functions/v1/send-event-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body    := '{}'::jsonb
  ) as request_id;
  $$
);

-- To check the cron job is registered:
-- select * from cron.job;

-- To unschedule if needed:
-- select cron.unschedule('send-event-reminders');
