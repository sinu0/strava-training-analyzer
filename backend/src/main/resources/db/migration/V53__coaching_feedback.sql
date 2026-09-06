CREATE TABLE coaching_feedback (
    id uuid PRIMARY KEY,
    source_key varchar(180) NOT NULL UNIQUE,
    occurred_at timestamptz NOT NULL,
    session_type varchar(40),
    rpe integer CHECK (rpe BETWEEN 1 AND 10),
    quality double precision CHECK (quality BETWEEN 0 AND 1),
    completed boolean NOT NULL
);
CREATE INDEX coaching_feedback_occurred_at_idx ON coaching_feedback (occurred_at);
