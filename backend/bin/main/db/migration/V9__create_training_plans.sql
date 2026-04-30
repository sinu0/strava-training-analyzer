CREATE TABLE training_plans (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date                  DATE NOT NULL,
    planned_type          VARCHAR(50),
    planned_tss           DECIMAL(6,2),
    planned_duration_min  INTEGER,
    planned_description   TEXT,
    actual_activity_id    UUID REFERENCES activities(id),
    compliance_pct        DECIMAL(5,2),
    created_at            TIMESTAMP DEFAULT NOW()
);
