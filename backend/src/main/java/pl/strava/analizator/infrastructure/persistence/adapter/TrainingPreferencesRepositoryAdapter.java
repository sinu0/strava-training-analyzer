package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.Instant;
import java.util.Optional;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import pl.strava.analizator.domain.model.TrainingPreferences;
import pl.strava.analizator.domain.port.TrainingPreferencesRepository;
import pl.strava.analizator.infrastructure.persistence.entity.AppConfigEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.AppConfigJpaRepository;

@Repository @RequiredArgsConstructor
public class TrainingPreferencesRepositoryAdapter implements TrainingPreferencesRepository {
    private static final String KEY = "training.preferences.v1";
    private final AppConfigJpaRepository repository;
    private final ObjectMapper mapper;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Override public Optional<TrainingPreferences> find() {
        return repository.findByConfigKey(KEY).map(entity -> {
            try { return mapper.readValue(entity.getConfigValue(), TrainingPreferences.class); }
            catch (JsonProcessingException e) { throw new IllegalStateException("Nie można odczytać kontekstu treningowego", e); }
        });
    }

    @Override @Transactional public TrainingPreferences save(TrainingPreferences value) {
        String serialized;
        try { serialized = mapper.writeValueAsString(value); }
        catch (JsonProcessingException e) { throw new IllegalStateException("Nie można zapisać kontekstu treningowego", e); }
        int changed = value.getRevision() == 1
                ? jdbc.update("INSERT INTO app_config(id, config_key, config_value, encrypted, updated_at) VALUES (?, ?, ?, false, now()) ON CONFLICT (config_key) DO NOTHING", java.util.UUID.randomUUID(), KEY, serialized)
                : jdbc.update("UPDATE app_config SET config_value=?, updated_at=now() WHERE config_key=? AND (config_value::jsonb->>'revision')::bigint=?", serialized, KEY, value.getRevision() - 1);
        if (changed != 1) throw new pl.strava.analizator.application.UiPreferencesConflictException("Kontekst zmienił się. Odśwież dane przed zapisem.");
        return value;
    }
}
