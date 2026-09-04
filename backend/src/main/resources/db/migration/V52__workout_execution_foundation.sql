ALTER TABLE workout_templates
    ADD COLUMN current_revision INTEGER NOT NULL DEFAULT 1;

CREATE TABLE workout_template_revisions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id         UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    revision            INTEGER NOT NULL CHECK (revision > 0),
    name                VARCHAR(100) NOT NULL,
    category            VARCHAR(30) NOT NULL,
    description         TEXT,
    target_tss          DECIMAL(6,2),
    target_duration_min INTEGER NOT NULL,
    relative_effort     INTEGER CHECK (relative_effort BETWEEN 1 AND 10),
    intensity_factor    DECIMAL(4,3),
    steps               JSONB NOT NULL,
    created_by          VARCHAR(20) NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (template_id, revision)
);

INSERT INTO workout_template_revisions (
    template_id, revision, name, category, description, target_tss,
    target_duration_min, relative_effort, intensity_factor, steps, created_by, created_at
)
SELECT id, 1, name, category, description, target_tss,
       target_duration_min, relative_effort, intensity_factor, steps, created_by,
       COALESCE(created_at, NOW())
FROM workout_templates;

ALTER TABLE workout_templates
    ADD COLUMN current_revision_id UUID REFERENCES workout_template_revisions(id) ON DELETE RESTRICT;

UPDATE workout_templates template
SET current_revision_id = revision.id
FROM workout_template_revisions revision
WHERE revision.template_id = template.id
  AND revision.revision = template.current_revision;

ALTER TABLE training_plans
    ADD COLUMN workout_template_revision_id UUID REFERENCES workout_template_revisions(id) ON DELETE SET NULL,
    ADD COLUMN workout_template_revision INTEGER,
    ADD COLUMN workout_name_snapshot VARCHAR(100),
    ADD COLUMN workout_steps_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN ftp_watts INTEGER CHECK (ftp_watts > 0),
    ADD COLUMN lthr_bpm INTEGER CHECK (lthr_bpm > 0),
    ADD COLUMN max_hr_bpm INTEGER CHECK (max_hr_bpm > 0),
    ADD COLUMN resting_hr_bpm INTEGER CHECK (resting_hr_bpm > 0),
    ADD COLUMN delivery_method VARCHAR(30) NOT NULL DEFAULT 'ON_DEVICE',
    ADD COLUMN delivery_status VARCHAR(30) NOT NULL DEFAULT 'READY',
    ADD COLUMN activity_match_status VARCHAR(30) NOT NULL DEFAULT 'UNMATCHED';

UPDATE training_plans plan
SET workout_template_revision_id = revision.id,
    workout_template_revision = revision.revision,
    workout_name_snapshot = revision.name,
    workout_steps_snapshot = revision.steps
FROM workout_template_revisions revision
WHERE revision.template_id = plan.workout_template_id
  AND revision.revision = 1;

CREATE INDEX idx_training_plans_today_status
    ON training_plans (date, status);
CREATE INDEX idx_training_plans_template_revision
    ON training_plans (workout_template_revision_id);
CREATE INDEX idx_workout_template_revisions_template
    ON workout_template_revisions (template_id, revision DESC);

CREATE TABLE workout_executions (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_plan_id             UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    workout_template_revision    INTEGER,
    workout_name_snapshot        VARCHAR(100) NOT NULL,
    workout_steps_snapshot       JSONB NOT NULL,
    ftp_watts                    INTEGER CHECK (ftp_watts > 0),
    lthr_bpm                     INTEGER CHECK (lthr_bpm > 0),
    max_hr_bpm                   INTEGER CHECK (max_hr_bpm > 0),
    resting_hr_bpm               INTEGER CHECK (resting_hr_bpm > 0),
    started_at                   TIMESTAMPTZ NOT NULL,
    finished_at                  TIMESTAMPTZ,
    status                       VARCHAR(20) NOT NULL CHECK (status IN ('READY','RUNNING','PAUSED','COMPLETED','ABORTED')),
    current_step_index           INTEGER NOT NULL DEFAULT 0 CHECK (current_step_index >= 0),
    workout_elapsed_ms           BIGINT NOT NULL DEFAULT 0 CHECK (workout_elapsed_ms >= 0),
    step_elapsed_ms              BIGINT NOT NULL DEFAULT 0 CHECK (step_elapsed_ms >= 0),
    running_since                TIMESTAMPTZ,
    intensity_adjustment_pct     INTEGER NOT NULL DEFAULT 0 CHECK (intensity_adjustment_pct BETWEEN -50 AND 50),
    skipped_step_indexes         INTEGER[] NOT NULL DEFAULT '{}',
    repeated_step_indexes        INTEGER[] NOT NULL DEFAULT '{}',
    rpe                          INTEGER CHECK (rpe BETWEEN 1 AND 10),
    feeling                      VARCHAR(20),
    notes                        TEXT,
    activity_id                  UUID UNIQUE REFERENCES activities(id) ON DELETE SET NULL,
    activity_match_status        VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    compliance_status            VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    compliance_score             INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
    compliance_algorithm_version VARCHAR(40) NOT NULL DEFAULT 'workout-compliance-v1',
    start_idempotency_key        VARCHAR(100) NOT NULL UNIQUE,
    finish_idempotency_key       VARCHAR(100) UNIQUE,
    delivery_method              VARCHAR(30) NOT NULL DEFAULT 'ON_DEVICE',
    state_version                BIGINT NOT NULL DEFAULT 0,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_workout_executions_one_active
    ON workout_executions ((TRUE))
    WHERE status IN ('READY', 'RUNNING', 'PAUSED');
CREATE INDEX idx_workout_executions_plan_started
    ON workout_executions (training_plan_id, started_at DESC);
CREATE INDEX idx_workout_executions_completed_unlinked
    ON workout_executions (finished_at)
    WHERE status = 'COMPLETED' AND activity_id IS NULL;

CREATE TABLE workout_execution_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id    UUID NOT NULL REFERENCES workout_executions(id) ON DELETE CASCADE,
    sequence_no     INTEGER NOT NULL CHECK (sequence_no > 0),
    event_type      VARCHAR(30) NOT NULL,
    occurred_at     TIMESTAMPTZ NOT NULL,
    workout_elapsed_ms BIGINT NOT NULL CHECK (workout_elapsed_ms >= 0),
    step_index      INTEGER,
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (execution_id, sequence_no),
    UNIQUE (execution_id, idempotency_key)
);

CREATE INDEX idx_workout_execution_events_execution
    ON workout_execution_events (execution_id, sequence_no);
