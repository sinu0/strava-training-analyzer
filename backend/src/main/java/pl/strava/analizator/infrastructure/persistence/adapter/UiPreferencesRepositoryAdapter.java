package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import pl.strava.analizator.domain.model.DashboardWidget;
import pl.strava.analizator.domain.model.UiPreferences;
import pl.strava.analizator.domain.port.UiPreferencesRepository;
import pl.strava.analizator.infrastructure.persistence.entity.UiPreferencesEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.UiPreferencesJpaRepository;

@Component
@RequiredArgsConstructor
public class UiPreferencesRepositoryAdapter implements UiPreferencesRepository {

    private static final short SINGLETON_ID = 1;

    private final UiPreferencesJpaRepository jpaRepository;
    private final ObjectMapper objectMapper;

    @Override
    public Optional<UiPreferences> find() {
        return jpaRepository.findById(SINGLETON_ID).map(this::toDomain);
    }

    @Override
    @SneakyThrows
    public UiPreferences save(UiPreferences preferences) {
        UiPreferencesEntity entity = UiPreferencesEntity.builder()
                .id(SINGLETON_ID)
                .schemaVersion(preferences.getSchemaVersion())
                .revision(preferences.getRevision())
                .dashboardJson(objectMapper.writeValueAsString(preferences.getWidgets()))
                .mobileNavigationJson(objectMapper.writeValueAsString(preferences.getMobileNavigation()))
                .updatedAt(Instant.now())
                .build();
        return toDomain(jpaRepository.save(entity));
    }

    @SneakyThrows
    private UiPreferences toDomain(UiPreferencesEntity entity) {
        List<DashboardWidget> widgets = objectMapper.readValue(
                entity.getDashboardJson(), new TypeReference<>() {});
        List<String> navigation = objectMapper.readValue(
                entity.getMobileNavigationJson(), new TypeReference<>() {});
        return UiPreferences.builder()
                .schemaVersion(entity.getSchemaVersion())
                .revision(entity.getRevision())
                .widgets(widgets)
                .mobileNavigation(navigation)
                .build();
    }
}
