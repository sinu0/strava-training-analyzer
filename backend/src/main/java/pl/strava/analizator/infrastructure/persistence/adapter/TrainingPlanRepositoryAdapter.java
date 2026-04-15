package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.TrainingPlanJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.TrainingPlanMapper;

@Component
@RequiredArgsConstructor
public class TrainingPlanRepositoryAdapter implements TrainingPlanRepository {

    private final TrainingPlanJpaRepository jpaRepository;
    private final TrainingPlanMapper mapper;

    @Override
    public List<TrainingPlan> findByDateRange(LocalDate from, LocalDate to) {
        return jpaRepository.findByDateBetweenOrderByDateAsc(from, to).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Optional<TrainingPlan> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<TrainingPlan> findByProgramId(UUID programId) {
        return jpaRepository.findByProgramIdOrderByDateAsc(programId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public TrainingPlan save(TrainingPlan plan) {
        var entity = mapper.toEntity(plan);
        var saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void updateStatus(UUID id, TrainingPlanStatus status) {
        jpaRepository.updateStatus(id, status.name());
    }
}
