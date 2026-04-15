package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.TrainingZone;
import pl.strava.analizator.domain.port.TrainingZoneRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.TrainingZoneJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.TrainingZoneEntityMapper;

@Component
@RequiredArgsConstructor
public class TrainingZoneRepositoryAdapter implements TrainingZoneRepository {

    private final TrainingZoneJpaRepository jpaRepository;
    private final TrainingZoneEntityMapper mapper;

    @Override
    public List<TrainingZone> findCurrentZones(LocalDate date) {
        return jpaRepository
            .findCurrentZones(date)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }
}