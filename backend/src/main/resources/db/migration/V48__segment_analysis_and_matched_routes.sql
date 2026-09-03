CREATE TABLE segments (
    id BIGINT PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    activity_type VARCHAR(40),
    distance_m DECIMAL(12,2),
    average_grade DECIMAL(7,3),
    maximum_grade DECIMAL(7,3),
    elevation_high_m DECIMAL(9,2),
    elevation_low_m DECIMAL(9,2),
    start_latitude DOUBLE PRECISION,
    start_longitude DOUBLE PRECISION,
    end_latitude DOUBLE PRECISION,
    end_longitude DOUBLE PRECISION,
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    private_segment BOOLEAN NOT NULL DEFAULT FALSE,
    local_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    route_polyline TEXT,
    effort_count INTEGER NOT NULL DEFAULT 0,
    best_elapsed_time_sec INTEGER,
    latest_effort_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_segments_name_lower ON segments (LOWER(name));
CREATE INDEX idx_segments_favorite ON segments (local_favorite) WHERE local_favorite;
CREATE INDEX idx_segments_effort_count ON segments (effort_count DESC);

CREATE TABLE segment_efforts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id BIGINT,
    segment_id BIGINT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    sequence_number INTEGER NOT NULL,
    start_index INTEGER,
    end_index INTEGER,
    elapsed_time_sec INTEGER,
    moving_time_sec INTEGER,
    distance_m DECIMAL(12,2),
    average_power_w SMALLINT,
    average_heartrate SMALLINT,
    max_heartrate SMALLINT,
    average_speed_ms DECIMAL(9,4),
    average_cadence SMALLINT,
    elevation_gain_m DECIMAL(9,2),
    device_watts BOOLEAN,
    strava_pr_rank INTEGER,
    record_at_time BOOLEAN NOT NULL DEFAULT FALSE,
    previous_best_elapsed_time_sec INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_segment_effort_activity_slice UNIQUE NULLS NOT DISTINCT (activity_id, segment_id, start_index)
);

CREATE UNIQUE INDEX uq_segment_efforts_external_id ON segment_efforts(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_segment_efforts_segment_history ON segment_efforts(segment_id, started_at, elapsed_time_sec);
CREATE INDEX idx_segment_efforts_activity_sequence ON segment_efforts(activity_id, sequence_number);

CREATE TABLE segment_activity_imports (
    activity_id UUID PRIMARY KEY REFERENCES activities(id) ON DELETE CASCADE,
    capability VARCHAR(20) NOT NULL,
    effort_count INTEGER NOT NULL DEFAULT 0,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE route_fingerprints (
    activity_id UUID PRIMARY KEY REFERENCES activities(id) ON DELETE CASCADE,
    algorithm_version INTEGER NOT NULL,
    exact_hash CHAR(64) NOT NULL,
    reverse_hash CHAR(64) NOT NULL,
    fuzzy_key VARCHAR(80) NOT NULL,
    normalized_polyline TEXT NOT NULL,
    route_geometry geometry(LINESTRING, 4326)
        GENERATED ALWAYS AS (ST_SetSRID(ST_LineFromEncodedPolyline(normalized_polyline, 5), 4326)) STORED,
    distance_m DOUBLE PRECISION NOT NULL,
    center_latitude DOUBLE PRECISION NOT NULL,
    center_longitude DOUBLE PRECISION NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_route_fingerprints_exact ON route_fingerprints(algorithm_version, exact_hash);
CREATE INDEX idx_route_fingerprints_reverse ON route_fingerprints(algorithm_version, reverse_hash);
CREATE INDEX idx_route_fingerprints_fuzzy ON route_fingerprints(algorithm_version, fuzzy_key);
CREATE INDEX idx_route_fingerprints_distance ON route_fingerprints(distance_m);
CREATE INDEX idx_route_fingerprints_geometry ON route_fingerprints USING GIST(route_geometry);

CREATE TABLE route_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL,
    canonical_activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE RESTRICT,
    direction_key CHAR(64) NOT NULL,
    algorithm_version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_route_group_family_direction UNIQUE(family_id, direction_key, algorithm_version)
);

CREATE INDEX idx_route_groups_family ON route_groups(family_id);

CREATE TABLE matched_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_group_id UUID NOT NULL REFERENCES route_groups(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    matched_to_activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    similarity_percent DECIMAL(5,2) NOT NULL,
    exact_match BOOLEAN NOT NULL DEFAULT FALSE,
    direction_variant VARCHAR(20) NOT NULL,
    algorithm_version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_matched_route_activity_version UNIQUE(activity_id, algorithm_version)
);

CREATE INDEX idx_matched_routes_group ON matched_routes(route_group_id);

CREATE TABLE analysis_backfill_state (
    job_type VARCHAR(20) PRIMARY KEY,
    status VARCHAR(20) NOT NULL,
    processed INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    capability VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    rate_limit_resets_at TIMESTAMPTZ,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

INSERT INTO analysis_backfill_state(job_type, status) VALUES
    ('SEGMENTS', 'IDLE'),
    ('ROUTES', 'IDLE');
