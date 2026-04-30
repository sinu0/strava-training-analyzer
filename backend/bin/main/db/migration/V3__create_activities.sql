CREATE TABLE activities (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id         VARCHAR(255),
    source              VARCHAR(50) NOT NULL,
    sport_type          VARCHAR(50) NOT NULL DEFAULT 'cycling',
    name                VARCHAR(500),
    description         TEXT,

    started_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    elapsed_time_sec    INTEGER,
    moving_time_sec     INTEGER,

    distance_m          DECIMAL(12,2),
    elevation_gain_m    DECIMAL(8,2),
    elevation_loss_m    DECIMAL(8,2),

    avg_speed_ms        DECIMAL(8,4),
    max_speed_ms        DECIMAL(8,4),

    avg_heartrate       SMALLINT,
    max_heartrate       SMALLINT,

    avg_power_w         SMALLINT,
    max_power_w         SMALLINT,

    avg_cadence         SMALLINT,
    max_cadence         SMALLINT,

    calories            INTEGER,
    avg_temp_c          DECIMAL(4,1),
    weather             JSONB,
    gear_id             UUID REFERENCES gear(id),

    route               GEOGRAPHY(LINESTRING, 4326),
    summary_polyline    TEXT,

    splits              JSONB,
    laps                JSONB,
    streams             JSONB,

    raw_data            JSONB,
    tags                TEXT[],
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),

    CONSTRAINT uq_activity_source UNIQUE (external_id, source)
);

CREATE INDEX idx_activities_started_at ON activities(started_at DESC);
CREATE INDEX idx_activities_sport ON activities(sport_type, started_at DESC);
CREATE INDEX idx_activities_route ON activities USING GIST(route);
