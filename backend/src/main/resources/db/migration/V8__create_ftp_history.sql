CREATE TABLE ftp_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ftp_watts       SMALLINT NOT NULL,
    source          VARCHAR(50),
    test_date       DATE NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);
