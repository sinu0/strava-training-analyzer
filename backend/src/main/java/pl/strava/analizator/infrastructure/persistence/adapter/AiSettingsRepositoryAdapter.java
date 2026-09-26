package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.Instant;
import java.util.Optional;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.ai.AiLanguage;
import pl.strava.analizator.domain.ai.AiSettings;
import pl.strava.analizator.domain.ai.Persona;
import pl.strava.analizator.domain.port.AiSettingsRepository;
import pl.strava.analizator.infrastructure.persistence.entity.AiSettingsEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.AiSettingsJpaRepository;

@Component
@RequiredArgsConstructor
public class AiSettingsRepositoryAdapter implements AiSettingsRepository {

    private static final short SINGLETON_ID = 1;

    private final AiSettingsJpaRepository jpaRepository;

    @Override
    public Optional<AiSettings> find() {
        return jpaRepository.findById(SINGLETON_ID).map(this::toDomain);
    }

    @Override
    public AiSettings save(AiSettings settings) {
        AiSettingsEntity entity = AiSettingsEntity.builder()
                .id(SINGLETON_ID)
                .language(settings.getLanguage().code())
                .coachingStyle(settings.getCoachingStyle().name())
                .updatedAt(Instant.now())
                .build();
        return toDomain(jpaRepository.save(entity));
    }

    private AiSettings toDomain(AiSettingsEntity entity) {
        return AiSettings.builder()
                .language(AiLanguage.fromCode(entity.getLanguage()))
                .coachingStyle(Persona.valueOf(entity.getCoachingStyle()))
                .build();
    }
}
