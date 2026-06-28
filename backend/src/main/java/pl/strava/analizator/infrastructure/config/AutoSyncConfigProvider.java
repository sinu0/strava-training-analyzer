package pl.strava.analizator.infrastructure.config;

import java.time.Instant;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.AutoSyncConfigPort;
import pl.strava.analizator.infrastructure.persistence.entity.AppConfigEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.AppConfigJpaRepository;

@Component
@RequiredArgsConstructor
public class AutoSyncConfigProvider implements AutoSyncConfigPort {

    private static final String KEY = "strava.auto_sync_interval_minutes";
    private static final int DEFAULT_MINUTES = 30;

    private final AppConfigJpaRepository configRepository;

    @Override
    public int getIntervalMinutes() {
        return configRepository.findByConfigKey(KEY)
                .map(e -> {
                    try {
                        return Integer.parseInt(e.getConfigValue());
                    } catch (NumberFormatException ex) {
                        return DEFAULT_MINUTES;
                    }
                })
                .orElse(DEFAULT_MINUTES);
    }

    @Transactional
    @Override
    public void setIntervalMinutes(int minutes) {
        AppConfigEntity entity = configRepository.findByConfigKey(KEY)
                .orElse(AppConfigEntity.builder()
                        .configKey(KEY)
                        .encrypted(false)
                        .build());
        entity.setConfigValue(String.valueOf(minutes));
        entity.setUpdatedAt(Instant.now());
        configRepository.save(entity);
    }
}
