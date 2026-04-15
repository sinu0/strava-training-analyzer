package pl.strava.analizator.domain.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.TrainingPlanProgram;

public interface TrainingPlanProgramRepository {
    List<TrainingPlanProgram> findAll();
    Optional<TrainingPlanProgram> findById(UUID id);
    TrainingPlanProgram save(TrainingPlanProgram program);
    void deleteById(UUID id);
}
