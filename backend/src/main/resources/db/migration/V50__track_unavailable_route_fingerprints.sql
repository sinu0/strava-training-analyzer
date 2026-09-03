ALTER TABLE route_fingerprints
    ADD COLUMN capability VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    ALTER COLUMN exact_hash DROP NOT NULL,
    ALTER COLUMN reverse_hash DROP NOT NULL,
    ALTER COLUMN fuzzy_key DROP NOT NULL,
    ALTER COLUMN normalized_polyline DROP NOT NULL,
    ALTER COLUMN distance_m DROP NOT NULL,
    ALTER COLUMN center_latitude DROP NOT NULL,
    ALTER COLUMN center_longitude DROP NOT NULL;

CREATE INDEX idx_route_fingerprints_capability
    ON route_fingerprints(algorithm_version, capability);
