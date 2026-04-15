ALTER TABLE daily_summary ADD COLUMN IF NOT EXISTS deep_sleep_seconds INTEGER;
ALTER TABLE daily_summary ADD COLUMN IF NOT EXISTS light_sleep_seconds INTEGER;
ALTER TABLE daily_summary ADD COLUMN IF NOT EXISTS rem_sleep_seconds INTEGER;
ALTER TABLE daily_summary ADD COLUMN IF NOT EXISTS awake_sleep_seconds INTEGER;
