package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.WorkoutTemplateDto;
import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.domain.port.WorkoutTemplateRepository;

@ExtendWith(MockitoExtension.class)
class WorkoutTemplateServiceTest {

    @Mock
    private WorkoutTemplateRepository repository;

    @InjectMocks
    private WorkoutTemplateService service;

    @Test
    void getAllReturnsAllTemplates() {
        WorkoutTemplate t1 = buildTemplate("Regeneracja", WorkoutCategory.RECOVERY);
        WorkoutTemplate t2 = buildTemplate("Endurance Base", WorkoutCategory.ENDURANCE);
        when(repository.findAll()).thenReturn(List.of(t1, t2));

        List<WorkoutTemplateDto> result = service.getAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Regeneracja");
        assertThat(result.get(1).getName()).isEqualTo("Endurance Base");
    }

    @Test
    void getByCategoryFiltersCorrectly() {
        WorkoutTemplate t1 = buildTemplate("Threshold 2×15", WorkoutCategory.THRESHOLD);
        when(repository.findByCategory(WorkoutCategory.THRESHOLD)).thenReturn(List.of(t1));

        List<WorkoutTemplateDto> result = service.getByCategory("THRESHOLD");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo("THRESHOLD");
    }

    @Test
    void getByIdReturnsTemplate() {
        UUID id = UUID.randomUUID();
        WorkoutTemplate template = buildTemplateWithId(id, "Sweet Spot 2×20", WorkoutCategory.SWEET_SPOT);
        when(repository.findById(id)).thenReturn(Optional.of(template));

        WorkoutTemplateDto result = service.getById(id);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(id);
        assertThat(result.getName()).isEqualTo("Sweet Spot 2×20");
    }

    @Test
    void getByIdThrowsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(id))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createPersistsAndReturnsDto() {
        WorkoutTemplate template = buildTemplate("VO2max 5×4", WorkoutCategory.VO2MAX);
        when(repository.save(any(WorkoutTemplate.class))).thenReturn(template);

        WorkoutTemplateDto result = service.create(
                "VO2max 5×4",
                "VO2MAX",
                "High intensity intervals",
                BigDecimal.valueOf(90),
                60,
                9,
                BigDecimal.valueOf(1.05),
                List.of(),
                "system"
        );

        assertThat(result.getName()).isEqualTo("VO2max 5×4");
        assertThat(result.getCategory()).isEqualTo("VO2MAX");
        verify(repository).save(any(WorkoutTemplate.class));
    }

    @Test
    void deleteCallsPort() {
        UUID id = UUID.randomUUID();

        service.delete(id);

        verify(repository).deleteById(id);
    }

    private WorkoutTemplate buildTemplate(String name, WorkoutCategory category) {
        return buildTemplateWithId(UUID.randomUUID(), name, category);
    }

    private WorkoutTemplate buildTemplateWithId(UUID id, String name, WorkoutCategory category) {
        return WorkoutTemplate.builder()
                .id(id)
                .name(name)
                .category(category)
                .description("Test description")
                .targetTss(BigDecimal.valueOf(80))
                .targetDurationMin(60)
                .relativeEffort(7)
                .intensityFactor(BigDecimal.valueOf(0.88))
                .steps(List.of(
                        WorkoutStep.builder()
                                .type("warmup")
                                .durationSec(600)
                                .powerPctFtpLow(50)
                                .powerPctFtpHigh(65)
                                .build()
                ))
                .createdBy("system")
                .createdAt(OffsetDateTime.now())
                .build();
    }
}
