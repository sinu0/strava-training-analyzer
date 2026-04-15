package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WeightGoal;
import pl.strava.analizator.domain.model.WeightRecord;
import pl.strava.analizator.domain.port.WeightRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.WeightGoalJpaRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.WeightHistoryJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.WeightEntityMapper;

@Component
@RequiredArgsConstructor
public class WeightRepositoryAdapter implements WeightRepository {

    private final WeightHistoryJpaRepository historyJpa;
    private final WeightGoalJpaRepository goalJpa;
    private final WeightEntityMapper mapper;

    @Override
    public WeightRecord save(WeightRecord record) {
        var entity = mapper.toEntity(record);
        var saved = historyJpa.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<WeightRecord> findByDate(LocalDate date) {
        return historyJpa.findByRecordedDate(date).map(mapper::toDomain);
    }

    @Override
    public List<WeightRecord> findAllOrderByDate() {
        return historyJpa.findAllByOrderByRecordedDateAscLimited().stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<WeightRecord> findByDateRange(LocalDate from, LocalDate to) {
        return historyJpa.findByDateRange(from, to).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Optional<WeightRecord> findLatest() {
        return historyJpa.findLatest().map(mapper::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        historyJpa.deleteById(id);
    }

    @Override
    public Optional<WeightGoal> findActiveGoal() {
        return goalJpa.findLatest().map(mapper::toGoalDomain);
    }

    @Override
    public WeightGoal saveGoal(WeightGoal goal) {
        var entity = mapper.toGoalEntity(goal);
        var saved = goalJpa.save(entity);
        return mapper.toGoalDomain(saved);
    }

    @Override
    public void deleteGoal(UUID id) {
        goalJpa.deleteById(id);
    }
}
