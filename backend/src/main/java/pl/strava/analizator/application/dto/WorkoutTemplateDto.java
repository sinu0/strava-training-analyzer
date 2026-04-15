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

    private static void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) {
            map.put(key, value);
        }
    }
}
