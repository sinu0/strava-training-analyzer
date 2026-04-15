CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE athlete_profile (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(255) NOT NULL,
    email                 VARCHAR(255),
    ftp_watts             SMALLINT,
    lthr_bpm              SMALLINT,
    max_hr_bpm            SMALLINT,
    resting_hr_bpm        SMALLINT,
    weight_kg             DECIMAL(5,2),
    date_of_birth         DATE,
    strava_athlete_id     BIGINT UNIQUE,
    strava_access_token   TEXT,
    strava_refresh_token  TEXT,
    strava_token_expires  TIMESTAMP,
    garmin_user_id        VARCHAR(255),
    garmin_token          TEXT,
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW()
);
