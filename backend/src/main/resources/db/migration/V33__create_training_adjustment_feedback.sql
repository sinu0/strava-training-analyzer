CREATE TABLE training_adjustment_feedback (
    id UUID PRIMARY KEY,
    date DATE NOT NULL,
    plan_id UUID REFERENCES training_plans (id) ON DELETE SET NULL,
    suggestion_type VARCHAR(40) NOT NULL,
    suggestion_title VARCHAR(140),
    feedback VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_training_adjustment_feedback_created_at
    ON training_adjustment_feedback (created_at DESC);

CREATE INDEX idx_training_adjustment_feedback_type_created_at
    ON training_adjustment_feedback (suggestion_type, created_at DESC);
