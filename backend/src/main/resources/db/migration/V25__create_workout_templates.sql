CREATE TABLE workout_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL,
    category            VARCHAR(30) NOT NULL,
    description         TEXT,
    target_tss          DECIMAL(6,2),
    target_duration_min INTEGER NOT NULL,
    relative_effort     INTEGER CHECK (relative_effort BETWEEN 1 AND 10),
    intensity_factor    DECIMAL(4,3),
    steps               JSONB NOT NULL DEFAULT '[]',
    created_by          VARCHAR(20) NOT NULL DEFAULT 'system',
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workout_templates_category ON workout_templates(category);
