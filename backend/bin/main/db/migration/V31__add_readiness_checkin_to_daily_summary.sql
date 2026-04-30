ALTER TABLE daily_summary
    ADD COLUMN check_in_sleep_quality SMALLINT,
    ADD COLUMN check_in_leg_freshness SMALLINT,
    ADD COLUMN check_in_motivation SMALLINT,
    ADD COLUMN check_in_soreness SMALLINT,
    ADD COLUMN check_in_updated_at TIMESTAMP;
