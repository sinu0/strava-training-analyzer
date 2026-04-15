package pl.strava.analizator.application.ai;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.CustomPromptDto;
import pl.strava.analizator.domain.ai.CustomPrompt;
import pl.strava.analizator.domain.port.CustomPromptPort;

@Service
@RequiredArgsConstructor
public class CustomPromptService {

    private final CustomPromptPort customPromptPort;

    public List<CustomPromptDto> getAll() {
        return customPromptPort.findAll().stream()
                .map(this::toDto).toList();
    }

    public List<CustomPromptDto> getByType(String predictionType) {
        return customPromptPort.findByType(predictionType).stream()
                .map(this::toDto).toList();
    }

    public CustomPromptDto save(CustomPromptDto dto) {
        CustomPrompt prompt = CustomPrompt.builder()
                .id(dto.getId())
                .predictionType(dto.getPredictionType())
                .name(dto.getName())
                .systemPrompt(dto.getSystemPrompt())
                .userPromptTemplate(dto.getUserPromptTemplate())
                .responseFormat(dto.getResponseFormat())
                .active(dto.getId() != null ? dto.isActive() : false)
                .createdAt(dto.getId() != null ? dto.getCreatedAt() : Instant.now())
                .updatedAt(Instant.now())
                .build();
        return toDto(customPromptPort.save(prompt));
    }

    public CustomPromptDto activate(UUID id) {
        CustomPrompt prompt = customPromptPort.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Custom prompt not found: " + id));

        // Deactivate any other active prompt of the same type
        customPromptPort.findActiveByType(prompt.getPredictionType())
                .ifPresent(active -> {
                    CustomPrompt deactivated = CustomPrompt.builder()
                            .id(active.getId())
                            .predictionType(active.getPredictionType())
                            .name(active.getName())
                            .systemPrompt(active.getSystemPrompt())
                            .userPromptTemplate(active.getUserPromptTemplate())
                            .responseFormat(active.getResponseFormat())
                            .active(false)
                            .createdAt(active.getCreatedAt())
                            .updatedAt(Instant.now())
                            .build();
                    customPromptPort.save(deactivated);
                });

        CustomPrompt activated = CustomPrompt.builder()
                .id(prompt.getId())
                .predictionType(prompt.getPredictionType())
                .name(prompt.getName())
                .systemPrompt(prompt.getSystemPrompt())
                .userPromptTemplate(prompt.getUserPromptTemplate())
                .responseFormat(prompt.getResponseFormat())
                .active(true)
                .createdAt(prompt.getCreatedAt())
                .updatedAt(Instant.now())
                .build();
        return toDto(customPromptPort.save(activated));
    }

    public CustomPromptDto deactivate(UUID id) {
        CustomPrompt prompt = customPromptPort.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Custom prompt not found: " + id));

        CustomPrompt deactivated = CustomPrompt.builder()
                .id(prompt.getId())
                .predictionType(prompt.getPredictionType())
                .name(prompt.getName())
                .systemPrompt(prompt.getSystemPrompt())
                .userPromptTemplate(prompt.getUserPromptTemplate())
                .responseFormat(prompt.getResponseFormat())
                .active(false)
                .createdAt(prompt.getCreatedAt())
                .updatedAt(Instant.now())
                .build();
        return toDto(customPromptPort.save(deactivated));
    }

    public void delete(UUID id) {
        customPromptPort.deleteById(id);
    }

    public Optional<CustomPromptDto> getActiveForType(String predictionType) {
        return customPromptPort.findActiveByType(predictionType)
                .map(this::toDto);
    }

    private CustomPromptDto toDto(CustomPrompt prompt) {
        return CustomPromptDto.builder()
                .id(prompt.getId())
                .predictionType(prompt.getPredictionType())
                .name(prompt.getName())
                .systemPrompt(prompt.getSystemPrompt())
                .userPromptTemplate(prompt.getUserPromptTemplate())
                .responseFormat(prompt.getResponseFormat())
                .active(prompt.isActive())
                .createdAt(prompt.getCreatedAt())
                .updatedAt(prompt.getUpdatedAt())
                .build();
    }
}
