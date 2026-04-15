package pl.strava.analizator.infrastructure.persistence.ai;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.ai.CustomPrompt;
import pl.strava.analizator.domain.port.CustomPromptPort;
import pl.strava.analizator.infrastructure.persistence.entity.AiCustomPromptEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.AiCustomPromptJpaRepository;

@Component
@RequiredArgsConstructor
public class CustomPromptRepositoryAdapter implements CustomPromptPort {

    private final AiCustomPromptJpaRepository jpaRepository;

    @Override
    public List<CustomPrompt> findAll() {
        return jpaRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::toDomain).toList();
    }

    @Override
    public List<CustomPrompt> findByType(String predictionType) {
        return jpaRepository.findByPredictionTypeOrderByUpdatedAtDesc(predictionType).stream()
                .map(this::toDomain).toList();
    }

    @Override
    public Optional<CustomPrompt> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<CustomPrompt> findActiveByType(String predictionType) {
        return jpaRepository.findByPredictionTypeAndActiveTrue(predictionType).map(this::toDomain);
    }

    @Override
    public CustomPrompt save(CustomPrompt prompt) {
        AiCustomPromptEntity entity;
        if (prompt.getId() != null) {
            entity = jpaRepository.findById(prompt.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Custom prompt not found: " + prompt.getId()));
            entity.setName(prompt.getName());
            entity.setSystemPrompt(prompt.getSystemPrompt());
            entity.setUserPromptTemplate(prompt.getUserPromptTemplate());
            entity.setResponseFormat(prompt.getResponseFormat());
            entity.setActive(prompt.isActive());
            entity.setUpdatedAt(Instant.now());
        } else {
            entity = AiCustomPromptEntity.builder()
                    .predictionType(prompt.getPredictionType())
                    .name(prompt.getName())
                    .systemPrompt(prompt.getSystemPrompt())
                    .userPromptTemplate(prompt.getUserPromptTemplate())
                    .responseFormat(prompt.getResponseFormat())
                    .active(prompt.isActive())
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
        }
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    private CustomPrompt toDomain(AiCustomPromptEntity entity) {
        return CustomPrompt.builder()
                .id(entity.getId())
                .predictionType(entity.getPredictionType())
                .name(entity.getName())
                .systemPrompt(entity.getSystemPrompt())
                .userPromptTemplate(entity.getUserPromptTemplate())
                .responseFormat(entity.getResponseFormat())
                .active(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
