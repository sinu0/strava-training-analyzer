CREATE TABLE achievements (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    icon VARCHAR(32),
    type VARCHAR(32),
    unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at DATE
);
