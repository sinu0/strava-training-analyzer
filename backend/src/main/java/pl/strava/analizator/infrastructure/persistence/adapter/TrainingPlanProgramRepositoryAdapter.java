package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.TrainingPlanProgram;
import pl.strava.analizator.domain.port.TrainingPlanProgramRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.TrainingPlanProgramJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.TrainingPlanProgramMapper;

@Component
@RequiredArgsConstructor
public class TrainingPlanProgramRepositoryAdapter implements TrainingPlanProgramRepository {

    private final TrainingPlanProgramJpaRepository jpaRepository;
    private final TrainingPlanProgramMapper mapper;

    @Override
    public List<TrainingPlanProgram> findAll() {
        return jpaRepository.findAll().stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Optional<TrainingPlanProgram> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public TrainingPlanProgram save(TrainingPlanProgram program) {
        var entity = mapper.toEntity(program);
        var saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}
