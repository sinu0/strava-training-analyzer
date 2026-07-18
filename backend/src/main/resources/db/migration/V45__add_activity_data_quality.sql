CREATE TABLE activity_data_quality (
    activity_id UUID PRIMARY KEY REFERENCES activities(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    issues JSONB NOT NULL DEFAULT '[]'::jsonb,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_data_quality_status ON activity_data_quality(status);
