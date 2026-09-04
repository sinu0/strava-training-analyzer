package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.WorkoutTemplateDto;
import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.domain.port.WorkoutTemplateRepository;

@Service
@RequiredArgsConstructor
public class WorkoutTemplateService {

    private final WorkoutTemplateRepository repository;

    public List<WorkoutTemplateDto> getAll() {
        return repository.findAll().stream()
                .map(WorkoutTemplateDto::fromDomain)
                .toList();
    }

    public List<WorkoutTemplateDto> getByCategory(String category) {
        WorkoutCategory cat = WorkoutCategory.valueOf(category);
        return repository.findByCategory(cat).stream()
                .map(WorkoutTemplateDto::fromDomain)
                .toList();
    }

    public WorkoutTemplateDto getById(UUID id) {
        WorkoutTemplate template = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workout template not found: " + id));
        return WorkoutTemplateDto.fromDomain(template);
    }

    public WorkoutTemplateDto create(String name, String category, String description,
                                     BigDecimal targetTss, int targetDurationMin, int relativeEffort,
                                     BigDecimal intensityFactor, List<Map<String, Object>> steps,
                                     String createdBy) {
        List<WorkoutStep> domainSteps = steps.stream()
                .map(this::mapToStep)
                .toList();

        WorkoutTemplate template = WorkoutTemplate.builder()
                .name(name)
                .revision(1)
                .category(WorkoutCategory.valueOf(category))
                .description(description)
                .targetTss(targetTss)
                .targetDurationMin(targetDurationMin)
                .relativeEffort(relativeEffort)
                .intensityFactor(intensityFactor)
                .steps(domainSteps)
                .createdBy(createdBy != null ? createdBy : "user")
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build();

        return WorkoutTemplateDto.fromDomain(repository.save(template));
    }

    public void delete(UUID id) {
        repository.deleteById(id);
    }

    public WorkoutTemplateDto update(UUID id, String name, String category, String description,
                                     BigDecimal targetTss, int targetDurationMin, int relativeEffort,
                                     BigDecimal intensityFactor, List<Map<String, Object>> steps,
                                     String createdBy) {
        WorkoutTemplate current = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workout template not found: " + id));
        WorkoutTemplate updated = WorkoutTemplate.builder()
                .id(id)
                .revision(current.getRevision() + 1)
                .name(name)
                .category(WorkoutCategory.valueOf(category))
                .description(description)
                .targetTss(targetTss)
                .targetDurationMin(targetDurationMin)
                .relativeEffort(relativeEffort)
                .intensityFactor(intensityFactor)
                .steps(steps.stream().map(this::mapToStep).toList())
                .createdBy(createdBy != null ? createdBy : "user")
                .createdAt(OffsetDateTime.now(ZoneOffset.UTC))
                .build();
        return WorkoutTemplateDto.fromDomain(repository.save(updated));
    }

    private WorkoutStep mapToStep(Map<String, Object> map) {
        return WorkoutStep.builder()
                .type((String) map.get("type"))
                .name((String) map.get("name"))
                .instructions((String) map.get("instructions"))
                .durationType((String) map.get("durationType"))
                .durationSec(getInteger(map, "durationSec"))
                .powerPctFtpLow(getInteger(map, "powerPctFtpLow"))
                .powerPctFtpHigh(getInteger(map, "powerPctFtpHigh"))
                .heartRateBpmLow(getInteger(map, "heartRateBpmLow"))
                .heartRateBpmHigh(getInteger(map, "heartRateBpmHigh"))
                .cadenceRpmLow(getInteger(map, "cadenceRpmLow"))
                .cadenceRpmHigh(getInteger(map, "cadenceRpmHigh"))
                .repeat(getInteger(map, "repeat"))
                .onDurationSec(getInteger(map, "onDurationSec"))
                .onPowerPctFtpLow(getInteger(map, "onPowerPctFtpLow"))
                .onPowerPctFtpHigh(getInteger(map, "onPowerPctFtpHigh"))
                .onHeartRateBpmLow(getInteger(map, "onHeartRateBpmLow"))
                .onHeartRateBpmHigh(getInteger(map, "onHeartRateBpmHigh"))
                .onCadenceRpmLow(getInteger(map, "onCadenceRpmLow"))
                .onCadenceRpmHigh(getInteger(map, "onCadenceRpmHigh"))
                .offDurationSec(getInteger(map, "offDurationSec"))
                .offPowerPctFtpLow(getInteger(map, "offPowerPctFtpLow"))
                .offPowerPctFtpHigh(getInteger(map, "offPowerPctFtpHigh"))
                .offHeartRateBpmLow(getInteger(map, "offHeartRateBpmLow"))
                .offHeartRateBpmHigh(getInteger(map, "offHeartRateBpmHigh"))
                .offCadenceRpmLow(getInteger(map, "offCadenceRpmLow"))
                .offCadenceRpmHigh(getInteger(map, "offCadenceRpmHigh"))
                .build();
    }

    private Integer getInteger(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number n) {
            return n.intValue();
        }
        return null;
    }
}
