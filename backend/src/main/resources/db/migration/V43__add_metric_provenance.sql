ALTER TABLE activity_metrics
    ADD COLUMN input_fingerprint VARCHAR(64),
    ADD COLUMN as_of DATE;

ALTER TABLE daily_metric_values
    ADD COLUMN input_fingerprint VARCHAR(64),
    ADD COLUMN as_of DATE;

UPDATE activity_metrics
SET calculator_version = COALESCE(calculator_version, 'legacy-unknown'),
    as_of = COALESCE(as_of, calculated_at::date);

UPDATE daily_metric_values
SET calculator_version = COALESCE(calculator_version, 'legacy-unknown'),
    as_of = COALESCE(as_of, date);
