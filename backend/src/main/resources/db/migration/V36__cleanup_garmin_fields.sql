ALTER TABLE daily_summary RENAME COLUMN garmin_synced_at TO health_metrics_updated_at;

ALTER TABLE athlete_profile DROP COLUMN IF EXISTS garmin_user_id;
ALTER TABLE athlete_profile DROP COLUMN IF EXISTS garmin_token;
