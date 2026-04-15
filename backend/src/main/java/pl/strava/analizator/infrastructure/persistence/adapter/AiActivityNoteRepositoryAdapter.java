package pl.strava.analizator.infrastructure.persistence.adapter;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.ai.AiActivityNote;
import pl.strava.analizator.domain.port.AiActivityNoteRepository;
import pl.strava.analizator.infrastructure.persistence.entity.AiActivityNoteEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.AiActivityNoteJpaRepository;

@Component
@RequiredArgsConstructor
public class AiActivityNoteRepositoryAdapter implements AiActivityNoteRepository {

    private final AiActivityNoteJpaRepository jpaRepository;

    @Override
    public AiActivityNote save(AiActivityNote note) {
        AiActivityNoteEntity entity = AiActivityNoteEntity.builder()
                .id(note.getId())
                .activityId(note.getActivityId())
                .summary(note.getSummary())
                .detail(note.getDetail())
                .modelId(note.getModelId())
                .providerName(note.getProviderName())
                .generatedAt(note.getGeneratedAt())
                .build();
        AiActivityNoteEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<AiActivityNote> findByActivityId(UUID activityId) {
        return jpaRepository.findByActivityId(activityId).map(this::toDomain);
    }

    @Override
    @Transactional
    public void deleteByActivityId(UUID activityId) {
        jpaRepository.deleteByActivityId(activityId);
    }

    private AiActivityNote toDomain(AiActivityNoteEntity entity) {
        return AiActivityNote.builder()
                .id(entity.getId())
                .activityId(entity.getActivityId())
                .summary(entity.getSummary())
                .detail(entity.getDetail())
                .modelId(entity.getModelId())
                .providerName(entity.getProviderName())
                .generatedAt(entity.getGeneratedAt())
                .build();
    }
}
