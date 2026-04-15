package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutTemplate;

public interface WorkoutTemplateRepository {
    List<WorkoutTemplate> findAll();
    List<WorkoutTemplate> findByCategory(WorkoutCategory category);
    Optional<WorkoutTemplate> findById(UUID id);
    WorkoutTemplate save(WorkoutTemplate template);
    void deleteById(UUID id);
}
