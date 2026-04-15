package pl.strava.analizator.domain.port;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanStatus;

public interface TrainingPlanRepository {
    List<TrainingPlan> findByDateRange(LocalDate from, LocalDate to);
    Optional<TrainingPlan> findById(UUID id);
    List<TrainingPlan> findByProgramId(UUID programId);
    TrainingPlan save(TrainingPlan plan);
    void deleteById(UUID id);
    void updateStatus(UUID id, TrainingPlanStatus status);
}
