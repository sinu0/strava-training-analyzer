ALTER TABLE activities ADD COLUMN device_watts boolean;
-- Only explicit source metadata proves provenance. Do not infer it from stream presence.
UPDATE activities SET device_watts = (raw_data->>'device_watts')::boolean
WHERE raw_data->>'device_watts' IN ('true', 'false');
