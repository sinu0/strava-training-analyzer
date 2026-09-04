package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.model.WorkoutTemplate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutTemplateDto {
    private UUID id;
    private int revision;
    private String name;
    private String category;
    private String description;
    private BigDecimal targetTss;
    private int targetDurationMin;
    private int relativeEffort;
    private BigDecimal intensityFactor;
    private List<Map<String, Object>> steps;
    private String createdBy;
    private OffsetDateTime createdAt;

    public static WorkoutTemplateDto fromDomain(WorkoutTemplate t) {
        return WorkoutTemplateDto.builder()
                .id(t.getId())
                .revision(t.getRevision())
                .name(t.getName())
                .category(t.getCategory().name())
                .description(t.getDescription())
                .targetTss(t.getTargetTss())
                .targetDurationMin(t.getTargetDurationMin())
                .relativeEffort(t.getRelativeEffort())
                .intensityFactor(t.getIntensityFactor())
                .steps(t.getSteps().stream().map(WorkoutTemplateDto::stepToMap).toList())
                .createdBy(t.getCreatedBy())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private static Map<String, Object> stepToMap(WorkoutStep step) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("type", step.getType());
        putIfNotNull(map, "name", step.getName());
        putIfNotNull(map, "instructions", step.getInstructions());
        putIfNotNull(map, "durationType", step.getDurationType());
        putIfNotNull(map, "durationSec", step.getDurationSec());
        putIfNotNull(map, "powerPctFtpLow", step.getPowerPctFtpLow());
        putIfNotNull(map, "powerPctFtpHigh", step.getPowerPctFtpHigh());
        putIfNotNull(map, "heartRateBpmLow", step.getHeartRateBpmLow());
        putIfNotNull(map, "heartRateBpmHigh", step.getHeartRateBpmHigh());
        putIfNotNull(map, "cadenceRpmLow", step.getCadenceRpmLow());
        putIfNotNull(map, "cadenceRpmHigh", step.getCadenceRpmHigh());
        putIfNotNull(map, "repeat", step.getRepeat());
        putIfNotNull(map, "onDurationSec", step.getOnDurationSec());
        putIfNotNull(map, "onPowerPctFtpLow", step.getOnPowerPctFtpLow());
        putIfNotNull(map, "onPowerPctFtpHigh", step.getOnPowerPctFtpHigh());
        putIfNotNull(map, "onHeartRateBpmLow", step.getOnHeartRateBpmLow());
        putIfNotNull(map, "onHeartRateBpmHigh", step.getOnHeartRateBpmHigh());
        putIfNotNull(map, "onCadenceRpmLow", step.getOnCadenceRpmLow());
        putIfNotNull(map, "onCadenceRpmHigh", step.getOnCadenceRpmHigh());
        putIfNotNull(map, "offDurationSec", step.getOffDurationSec());
        putIfNotNull(map, "offPowerPctFtpLow", step.getOffPowerPctFtpLow());
        putIfNotNull(map, "offPowerPctFtpHigh", step.getOffPowerPctFtpHigh());
        putIfNotNull(map, "offHeartRateBpmLow", step.getOffHeartRateBpmLow());
        putIfNotNull(map, "offHeartRateBpmHigh", step.getOffHeartRateBpmHigh());
        putIfNotNull(map, "offCadenceRpmLow", step.getOffCadenceRpmLow());
        putIfNotNull(map, "offCadenceRpmHigh", step.getOffCadenceRpmHigh());
        return map;
    }

    private static void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
