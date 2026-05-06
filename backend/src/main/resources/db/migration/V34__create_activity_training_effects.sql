CREATE TABLE activity_training_effects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL UNIQUE REFERENCES activities (id) ON DELETE CASCADE,
    training_score INT NOT NULL CHECK (training_score BETWEEN 0 AND 100),
    aerobic_te NUMERIC(3,1),
    anaerobic_te NUMERIC(3,1),
    aerobic_label VARCHAR(30),
    anaerobic_label VARCHAR(30),
    primary_benefit VARCHAR(30) NOT NULL,
    secondary_benefit VARCHAR(30),
    recovery_time_hours INT NOT NULL CHECK (recovery_time_hours BETWEEN 1 AND 96),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_quality VARCHAR(20) NOT NULL DEFAULT 'POWER_ONLY',
    details JSONB
);

CREATE INDEX idx_ate_activity ON activity_training_effects (activity_id);
CREATE INDEX idx_ate_calculated ON activity_training_effects (calculated_at DESC);
