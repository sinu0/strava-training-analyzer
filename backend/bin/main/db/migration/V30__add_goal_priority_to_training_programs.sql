ALTER TABLE training_plan_programs
    ADD COLUMN goal_priority VARCHAR(5),
    ADD COLUMN event_date DATE,
    ADD COLUMN taper_start_date DATE;
