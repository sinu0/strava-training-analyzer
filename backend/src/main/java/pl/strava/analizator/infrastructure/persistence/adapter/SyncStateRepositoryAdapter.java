package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.SyncState;
import pl.strava.analizator.domain.port.SyncStateRepository;
import pl.strava.analizator.infrastructure.persistence.entity.SyncStateEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.SyncStateJpaRepository;

@Component
@RequiredArgsConstructor
public class SyncStateRepositoryAdapter implements SyncStateRepository {

    private final SyncStateJpaRepository jpaRepository;

    @Override
    public Optional<SyncState> findFirst() {
        return jpaRepository.findAll(PageRequest.of(0, 1)).stream().findFirst().map(this::toDomain);
    }

    @Override
    public SyncState save(SyncState state) {
        SyncStateEntity entity = toEntity(state);
        return toDomain(jpaRepository.save(entity));
    }

    private SyncState toDomain(SyncStateEntity e) {
        return SyncState.builder()
                .id(e.getId())
                .status(e.getStatus())
                .lastSyncAt(e.getLastSyncAt())
                .importedTotal(e.getImportedTotal())
                .skippedTotal(e.getSkippedTotal())
                .rateLimitResetsAt(e.getRateLimitResetsAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private SyncStateEntity toEntity(SyncState s) {
        return SyncStateEntity.builder()
                .id(s.getId())
                .status(s.getStatus())
                .lastSyncAt(s.getLastSyncAt())
                .importedTotal(s.getImportedTotal())
                .skippedTotal(s.getSkippedTotal())
                .rateLimitResetsAt(s.getRateLimitResetsAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
