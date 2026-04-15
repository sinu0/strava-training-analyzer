package pl.strava.analizator.domain.port;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import pl.strava.analizator.domain.model.WeightGoal;
import pl.strava.analizator.domain.model.WeightRecord;

public interface WeightRepository {

    WeightRecord save(WeightRecord record);

    Optional<WeightRecord> findByDate(LocalDate date);

    List<WeightRecord> findAllOrderByDate();

    List<WeightRecord> findByDateRange(LocalDate from, LocalDate to);

    Optional<WeightRecord> findLatest();

    void deleteById(UUID id);

    Optional<WeightGoal> findActiveGoal();

    WeightGoal saveGoal(WeightGoal goal);

    void deleteGoal(UUID id);
}
