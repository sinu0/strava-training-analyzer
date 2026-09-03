ALTER TABLE route_fingerprints
    ALTER COLUMN exact_hash TYPE VARCHAR(64),
    ALTER COLUMN reverse_hash TYPE VARCHAR(64);

ALTER TABLE route_groups
    ALTER COLUMN direction_key TYPE VARCHAR(64);
