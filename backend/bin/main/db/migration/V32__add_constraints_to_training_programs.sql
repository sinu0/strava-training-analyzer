ALTER TABLE training_plan_programs
    ADD COLUMN weekday_availability_minutes INTEGER,
    ADD COLUMN weekend_availability_minutes INTEGER,
    ADD COLUMN preferred_long_ride_day VARCHAR(15),
    ADD COLUMN environment_preference VARCHAR(30);
