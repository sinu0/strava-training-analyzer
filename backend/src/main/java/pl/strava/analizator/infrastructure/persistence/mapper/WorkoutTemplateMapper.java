package pl.strava.analizator.infrastructure.persistence.mapper;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.infrastructure.persistence.entity.WorkoutTemplateEntity;

@Component
@RequiredArgsConstructor
public class WorkoutTemplateMapper {

    private final ObjectMapper objectMapper;

    public WorkoutTemplate toDomain(WorkoutTemplateEntity entity) {
        return WorkoutTemplate.builder()
                .id(entity.getId())
                .name(entity.getName())
                .category(WorkoutCategory.valueOf(entity.getCategory()))
                .description(entity.getDescription())
                .targetTss(entity.getTargetTss())
                .targetDurationMin(entity.getTargetDurationMin())
                .relativeEffort(entity.getRelativeEffort() != null ? entity.getRelativeEffort() : 0)
                .intensityFactor(entity.getIntensityFactor())
                .steps(parseSteps(entity.getSteps()))
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    public WorkoutTemplateEntity toEntity(WorkoutTemplate domain) {
        return WorkoutTemplateEntity.builder()
                .id(domain.getId())
                .name(domain.getName())
                .category(domain.getCategory().name())
                .description(domain.getDescription())
                .targetTss(domain.getTargetTss())
                .targetDurationMin(domain.getTargetDurationMin())
                .relativeEffort(domain.getRelativeEffort())
                .intensityFactor(domain.getIntensityFactor())
                .steps(serializeSteps(domain.getSteps()))
                .createdBy(domain.getCreatedBy())
                .createdAt(domain.getCreatedAt())
                .build();
    }

    private List<WorkoutStep> parseSteps(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<Map<String, Object>> raw = objectMapper.readValue(json, new TypeReference<>() {});
            return raw.stream().map(this::mapToStep).toList();
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse workout steps JSON", e);
        }
    }

    private WorkoutStep mapToStep(Map<String, Object> map) {
        return WorkoutStep.builder()
                .type((String) map.get("type"))
                .durationSec(getInteger(map, "durationSec"))
                .powerPctFtpLow(getInteger(map, "powerPctFtpLow"))
                .powerPctFtpHigh(getInteger(map, "powerPctFtpHigh"))
                .repeat(getInteger(map, "repeat"))
                .onDurationSec(getInteger(map, "onDurationSec"))
                .onPowerPctFtpLow(getInteger(map, "onPowerPctFtpLow"))
                .onPowerPctFtpHigh(getInteger(map, "onPowerPctFtpHigh"))
                .offDurationSec(getInteger(map, "offDurationSec"))
                .offPowerPctFtpLow(getInteger(map, "offPowerPctFtpLow"))
                .offPowerPctFtpHigh(getInteger(map, "offPowerPctFtpHigh"))
                .build();
    }

    private Integer getInteger(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number n) {
            return n.intValue();
        }
        return null;
    }

    private String serializeSteps(List<WorkoutStep> steps) {
        if (steps == null || steps.isEmpty()) {
            return "[]";
        }
        try {
            List<Map<String, Object>> raw = steps.stream().map(this::stepToMap).toList();
            return objectMapper.writeValueAsString(raw);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize workout steps", e);
        }
    }

    private Map<String, Object> stepToMap(WorkoutStep step) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("type", step.getType());
        putIfNotNull(map, "durationSec", step.getDurationSec());
        putIfNotNull(map, "powerPctFtpLow", step.getPowerPctFtpLow());
        putIfNotNull(map, "powerPctFtpHigh", step.getPowerPctFtpHigh());
        putIfNotNull(map, "repeat", step.getRepeat());
        putIfNotNull(map, "onDurationSec", step.getOnDurationSec());
        putIfNotNull(map, "onPowerPctFtpLow", step.getOnPowerPctFtpLow());
        putIfNotNull(map, "onPowerPctFtpHigh", step.getOnPowerPctFtpHigh());
        putIfNotNull(map, "offDurationSec", step.getOffDurationSec());
        putIfNotNull(map, "offPowerPctFtpLow", step.getOffPowerPctFtpLow());
        putIfNotNull(map, "offPowerPctFtpHigh", step.getOffPowerPctFtpHigh());
        return map;
    }

    private void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
