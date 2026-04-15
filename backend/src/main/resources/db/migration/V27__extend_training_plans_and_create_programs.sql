-- New table for multi-week programs
CREATE TABLE training_plan_programs (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                 VARCHAR(200) NOT NULL,
    goal                 VARCHAR(30) NOT NULL,
    start_date           DATE NOT NULL,
    end_date             DATE NOT NULL,
    target_weekly_tss    DECIMAL(8,2),
    target_weekly_hours  DECIMAL(5,2),
    generated_by         VARCHAR(20) NOT NULL DEFAULT 'manual',
    created_at           TIMESTAMP DEFAULT NOW()
);

-- Extend training_plans
ALTER TABLE training_plans
    ADD COLUMN program_id UUID REFERENCES training_plan_programs(id) ON DELETE CASCADE,
    ADD COLUMN workout_template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
    ADD COLUMN target_power_low_w INTEGER,
    ADD COLUMN target_power_high_w INTEGER,
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    ADD COLUMN notes TEXT;

CREATE INDEX idx_training_plans_date ON training_plans(date);
CREATE INDEX idx_training_plans_program ON training_plans(program_id);
CREATE INDEX idx_training_plans_status ON training_plans(status);
