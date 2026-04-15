CREATE TABLE planned_route (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    waypoints               JSONB,
    polyline                JSONB,
    total_distance_m        DECIMAL(12,2),
    total_elevation_gain_m  DECIMAL(8,2),
    total_elevation_loss_m  DECIMAL(8,2),
    estimated_time_sec      INTEGER,
    estimated_tss           INTEGER,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_planned_route_created ON planned_route(created_at DESC);
