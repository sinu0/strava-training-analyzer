package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
                .category(WorkoutCategory.valueOf(category))
                .description(description)
                .targetTss(targetTss)
                .targetDurationMin(targetDurationMin)
                .relativeEffort(relativeEffort)
                .intensityFactor(intensityFactor)
                .steps(domainSteps)
                .createdBy(createdBy != null ? createdBy : "user")
                .build();

        return WorkoutTemplateDto.fromDomain(repository.save(template));
    }

    public void delete(UUID id) {
        repository.deleteById(id);
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
}
