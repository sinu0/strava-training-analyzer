CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'OTHER',
    priority VARCHAR(1) NOT NULL DEFAULT 'B',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX idx_events_date ON events (event_date ASC);
CREATE INDEX idx_events_active ON events (active) WHERE active = true;
