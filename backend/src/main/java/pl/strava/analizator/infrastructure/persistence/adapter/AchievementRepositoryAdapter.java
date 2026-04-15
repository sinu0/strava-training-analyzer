package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.gamification.Achievement;
import pl.strava.analizator.domain.port.AchievementRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.AchievementJpaRepository;
import pl.strava.analizator.infrastructure.persistence.mapper.AchievementMapper;

@Component
@RequiredArgsConstructor
public class AchievementRepositoryAdapter implements AchievementRepository {

    private final AchievementJpaRepository jpa;
    private final AchievementMapper mapper;

    @Override
    public List<Achievement> findAll() {
        return jpa.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Achievement> findById(String id) {
        return jpa.findById(id).map(mapper::toDomain);
    }

    @Override
    public void save(Achievement achievement) {
        jpa.save(mapper.toEntity(achievement));
    }
}
