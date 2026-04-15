package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.Optional;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.AthleteProfileJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.AthleteProfileEntityMapper;

@Component
@RequiredArgsConstructor
public class AthleteProfileRepositoryAdapter implements AthleteProfileRepository {

    private final AthleteProfileJpaRepository jpaRepository;
    private final AthleteProfileEntityMapper mapper;

    @Override
    public AthleteProfile save(AthleteProfile profile) {
        var entity = mapper.toEntity(profile);
        var saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<AthleteProfile> findFirst() {
        return jpaRepository.findFirst().map(mapper::toDomain);
    }

    @Override
    public Optional<AthleteProfile> findByStravaAthleteId(Long stravaAthleteId) {
        return jpaRepository.findByStravaAthleteId(stravaAthleteId).map(mapper::toDomain);
    }
}
