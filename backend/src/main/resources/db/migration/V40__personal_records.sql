CREATE TABLE personal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type VARCHAR(50) NOT NULL,
    record_value DOUBLE PRECISION NOT NULL,
    activity_id UUID REFERENCES activities(id),
    achieved_at DATE NOT NULL,
    previous_value DOUBLE PRECISION,
    improvement_percent DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pr_type ON personal_records(record_type);
CREATE INDEX idx_pr_achieved ON personal_records(achieved_at);
