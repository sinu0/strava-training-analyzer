CREATE TABLE weather_forecast_cache (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_name       VARCHAR(100) NOT NULL,
    latitude            DECIMAL(8,5) NOT NULL,
    longitude           DECIMAL(8,5) NOT NULL,
    forecast_date       DATE NOT NULL,
    daily_score         SMALLINT NOT NULL DEFAULT 0,
    best_window_start   VARCHAR(5),
    best_window_end     VARCHAR(5),
    best_window_score   SMALLINT,
    temp_min            DECIMAL(5,1),
    temp_max            DECIMAL(5,1),
    precipitation_sum   DECIMAL(6,1),
    wind_speed_max      DECIMAL(5,1),
    weather_code        SMALLINT,
    hourly_scores       JSONB NOT NULL DEFAULT '[]'::jsonb,
    computed_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_weather_cache_location_date UNIQUE (location_name, forecast_date)
);

CREATE INDEX idx_weather_cache_location ON weather_forecast_cache (location_name);
CREATE INDEX idx_weather_cache_date ON weather_forecast_cache (forecast_date);
