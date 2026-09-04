package pl.strava.analizator.infrastructure.persistence.mapper;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.WorkoutStep;

@Component
@RequiredArgsConstructor
public class WorkoutStepJsonCodec {
    private final ObjectMapper objectMapper;

    public List<WorkoutStep> deserialize(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<Map<String, Object>> raw = objectMapper.readValue(json, new TypeReference<>() { });
            return raw.stream().map(this::fromMap).toList();
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse workout steps JSON", e);
        }
    }

    public String serialize(List<WorkoutStep> steps) {
        try {
            return objectMapper.writeValueAsString(
                    steps != null ? steps.stream().map(this::toMap).toList() : List.of());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize workout steps", e);
        }
    }

    public WorkoutStep fromMap(Map<String, Object> map) {
        return WorkoutStep.builder()
                .type(string(map, "type"))
                .name(string(map, "name"))
                .instructions(string(map, "instructions"))
                .durationType(string(map, "durationType"))
                .durationSec(integer(map, "durationSec"))
                .powerPctFtpLow(integer(map, "powerPctFtpLow"))
                .powerPctFtpHigh(integer(map, "powerPctFtpHigh"))
                .heartRateBpmLow(integer(map, "heartRateBpmLow"))
                .heartRateBpmHigh(integer(map, "heartRateBpmHigh"))
                .cadenceRpmLow(integer(map, "cadenceRpmLow"))
                .cadenceRpmHigh(integer(map, "cadenceRpmHigh"))
                .repeat(integer(map, "repeat"))
                .onDurationSec(integer(map, "onDurationSec"))
                .onPowerPctFtpLow(integer(map, "onPowerPctFtpLow"))
                .onPowerPctFtpHigh(integer(map, "onPowerPctFtpHigh"))
                .onHeartRateBpmLow(integer(map, "onHeartRateBpmLow"))
                .onHeartRateBpmHigh(integer(map, "onHeartRateBpmHigh"))
                .onCadenceRpmLow(integer(map, "onCadenceRpmLow"))
                .onCadenceRpmHigh(integer(map, "onCadenceRpmHigh"))
                .offDurationSec(integer(map, "offDurationSec"))
                .offPowerPctFtpLow(integer(map, "offPowerPctFtpLow"))
                .offPowerPctFtpHigh(integer(map, "offPowerPctFtpHigh"))
                .offHeartRateBpmLow(integer(map, "offHeartRateBpmLow"))
                .offHeartRateBpmHigh(integer(map, "offHeartRateBpmHigh"))
                .offCadenceRpmLow(integer(map, "offCadenceRpmLow"))
                .offCadenceRpmHigh(integer(map, "offCadenceRpmHigh"))
                .build();
    }

    public Map<String, Object> toMap(WorkoutStep step) {
        Map<String, Object> map = new LinkedHashMap<>();
        put(map, "type", step.getType());
        put(map, "name", step.getName());
        put(map, "instructions", step.getInstructions());
        put(map, "durationType", step.getDurationType());
        put(map, "durationSec", step.getDurationSec());
        put(map, "powerPctFtpLow", step.getPowerPctFtpLow());
        put(map, "powerPctFtpHigh", step.getPowerPctFtpHigh());
        put(map, "heartRateBpmLow", step.getHeartRateBpmLow());
        put(map, "heartRateBpmHigh", step.getHeartRateBpmHigh());
        put(map, "cadenceRpmLow", step.getCadenceRpmLow());
        put(map, "cadenceRpmHigh", step.getCadenceRpmHigh());
        put(map, "repeat", step.getRepeat());
        put(map, "onDurationSec", step.getOnDurationSec());
        put(map, "onPowerPctFtpLow", step.getOnPowerPctFtpLow());
        put(map, "onPowerPctFtpHigh", step.getOnPowerPctFtpHigh());
        put(map, "onHeartRateBpmLow", step.getOnHeartRateBpmLow());
        put(map, "onHeartRateBpmHigh", step.getOnHeartRateBpmHigh());
        put(map, "onCadenceRpmLow", step.getOnCadenceRpmLow());
        put(map, "onCadenceRpmHigh", step.getOnCadenceRpmHigh());
        put(map, "offDurationSec", step.getOffDurationSec());
        put(map, "offPowerPctFtpLow", step.getOffPowerPctFtpLow());
        put(map, "offPowerPctFtpHigh", step.getOffPowerPctFtpHigh());
        put(map, "offHeartRateBpmLow", step.getOffHeartRateBpmLow());
        put(map, "offHeartRateBpmHigh", step.getOffHeartRateBpmHigh());
        put(map, "offCadenceRpmLow", step.getOffCadenceRpmLow());
        put(map, "offCadenceRpmHigh", step.getOffCadenceRpmHigh());
        return map;
    }

    private Integer integer(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value instanceof Number number ? number.intValue() : null;
    }

    private String string(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value instanceof String text ? text : null;
    }

    private void put(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
