ALTER TABLE daily_summary ADD COLUMN sleep_duration_seconds INTEGER;
ALTER TABLE daily_summary ADD COLUMN steps INTEGER;
ALTER TABLE daily_summary ADD COLUMN active_calories INTEGER;
ALTER TABLE daily_summary ADD COLUMN garmin_synced_at TIMESTAMP WITH TIME ZONE;
