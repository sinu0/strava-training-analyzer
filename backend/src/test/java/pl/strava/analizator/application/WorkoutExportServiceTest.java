package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.WorkoutCategory;
import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.model.WorkoutTemplate;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.WorkoutFileExporter;
import pl.strava.analizator.domain.port.WorkoutTemplateRepository;

@ExtendWith(MockitoExtension.class)
class WorkoutExportServiceTest {

    @Mock
    private WorkoutTemplateRepository workoutTemplateRepository;

    @Mock
    private AthleteProfileRepository athleteProfileRepository;

    @Mock
    private WorkoutFileExporter workoutFileExporter;

    @InjectMocks
    private WorkoutExportService service;

    @Test
    void exportAsZwoReturnsBytes() {
        UUID id = UUID.randomUUID();
        WorkoutTemplate template = buildTemplate(id);
        when(workoutTemplateRepository.findById(id)).thenReturn(Optional.of(template));
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.empty());
        when(workoutFileExporter.encodeAsZwo(eq(template), eq(200))).thenReturn("<xml/>".getBytes());

        byte[] result = service.exportAsZwo(id);

        assertThat(result).isNotEmpty();
        verify(workoutFileExporter).encodeAsZwo(template, 200);
    }

    @Test
    void exportAsFitReturnsBytes() {
        UUID id = UUID.randomUUID();
        WorkoutTemplate template = buildTemplate(id);
        AthleteProfile profile = AthleteProfile.builder()
                .ftpWatts((short) 280)
                .build();
        when(workoutTemplateRepository.findById(id)).thenReturn(Optional.of(template));
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(workoutFileExporter.encodeAsFit(eq(template), eq(280))).thenReturn(new byte[]{1, 2, 3});

        byte[] result = service.exportAsFit(id);

        assertThat(result).isNotEmpty();
        verify(workoutFileExporter).encodeAsFit(template, 280);
    }

    @Test
    void throwsWhenTemplateNotFound() {
        UUID id = UUID.randomUUID();
        when(workoutTemplateRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.exportAsZwo(id))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");
    }

    @Test
    void usesDefaultFtpWhenProfileHasNoFtp() {
        UUID id = UUID.randomUUID();
        WorkoutTemplate template = buildTemplate(id);
        AthleteProfile profile = AthleteProfile.builder()
                .ftpWatts(null)
                .build();
        when(workoutTemplateRepository.findById(id)).thenReturn(Optional.of(template));
        when(athleteProfileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(workoutFileExporter.encodeAsZwo(any(), eq(200))).thenReturn("<xml/>".getBytes());

        service.exportAsZwo(id);

        verify(workoutFileExporter).encodeAsZwo(template, 200);
    }

    private WorkoutTemplate buildTemplate(UUID id) {
        return WorkoutTemplate.builder()
                .id(id)
                .name("Test Workout")
                .category(WorkoutCategory.SWEET_SPOT)
                .description("Test")
                .targetTss(BigDecimal.valueOf(80))
                .targetDurationMin(60)
                .relativeEffort(7)
                .intensityFactor(BigDecimal.valueOf(0.88))
                .steps(List.of(
                        WorkoutStep.builder()
                                .type("steady")
                                .durationSec(600)
                                .powerPctFtpLow(88)
                                .powerPctFtpHigh(93)
                                .build()
                ))
                .createdBy("system")
                .createdAt(OffsetDateTime.now())
                .build();
    }
}
