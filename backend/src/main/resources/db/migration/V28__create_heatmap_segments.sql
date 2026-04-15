CREATE TABLE heatmap_segments (
    id          BIGSERIAL PRIMARY KEY,
    lat1        DOUBLE PRECISION NOT NULL,
    lon1        DOUBLE PRECISION NOT NULL,
    lat2        DOUBLE PRECISION NOT NULL,
    lon2        DOUBLE PRECISION NOT NULL,
    grid_key_a  VARCHAR(32)      NOT NULL,
    grid_key_b  VARCHAR(32)      NOT NULL,
    traversal_count INTEGER      NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX heatmap_segments_keys_idx ON heatmap_segments (grid_key_a, grid_key_b);
CREATE INDEX heatmap_segments_count_idx      ON heatmap_segments (traversal_count DESC);
