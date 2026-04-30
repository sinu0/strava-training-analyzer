CREATE TABLE daily_summary (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date                DATE NOT NULL UNIQUE,

    activities_count    SMALLINT DEFAULT 0,
    total_distance_m    DECIMAL(12,2) DEFAULT 0,
    total_time_sec      INTEGER DEFAULT 0,
    total_elevation_m   DECIMAL(8,2) DEFAULT 0,

    resting_hr_bpm      SMALLINT,
    hrv_rmssd           DECIMAL(6,2),
    sleep_score         SMALLINT,
    body_battery        SMALLINT,
    stress_avg          SMALLINT,

    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_summary_date ON daily_summary(date DESC);
