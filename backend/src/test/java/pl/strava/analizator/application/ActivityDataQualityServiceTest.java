package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.ActivityDataQuality;
import pl.strava.analizator.domain.port.ActivityDataQualityRepository;
import pl.strava.analizator.domain.port.ActivityRepository;

@ExtendWith(MockitoExtension.class)
class ActivityDataQualityServiceTest {
    @Mock private ActivityDataQualityRepository qualityRepository;
    @Mock private ActivityRepository activityRepository;
    private ActivityDataQualityService service;

    @BeforeEach
    void setUp() {
        service = new ActivityDataQualityService(qualityRepository, activityRepository);
        lenient().when(qualityRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void rideWithoutPowerCanStillBeAvailable() {
        Activity activity = Activity.builder().id(UUID.randomUUID())
                .timeStream(new int[]{0, 1})
                .heartrateStream(new int[]{130, 132})
                .distanceStream(new double[]{0, 8})
                .build();

        var result = service.assessAndSave(activity);

        assertThat(result.getStatus()).isEqualTo("AVAILABLE");
        assertThat(result.getIssues()).doesNotContain("MISSING_TRAINING_STREAM");
    }

    @Test
    void missingTimeIsUnknownRatherThanZeroQualityScore() {
        UUID id = UUID.randomUUID();
        Activity activity = Activity.builder().id(id).powerStream(new int[]{200}).build();
        when(qualityRepository.findByActivityId(id)).thenReturn(Optional.empty());
        when(activityRepository.findById(id)).thenReturn(Optional.of(activity));

        var result = service.get(id);

        assertThat(result.getStatus()).isEqualTo("UNKNOWN");
        assertThat(result.getIssues()).contains("MISSING_TIME_STREAM");
    }

    @Test
    void unassessedActivitiesAreReportedAsUnknownInSummary() {
        when(activityRepository.count()).thenReturn(10L);
        when(qualityRepository.findAll()).thenReturn(List.of(
                ActivityDataQuality.builder().activityId(UUID.randomUUID()).status("AVAILABLE")
                        .issues(List.of()).assessedAt(Instant.now()).build(),
                ActivityDataQuality.builder().activityId(UUID.randomUUID()).status("UNKNOWN")
                        .issues(List.of("MISSING_TIME_STREAM")).assessedAt(Instant.now()).build()));

        var result = service.summary();

        assertThat(result.getTotalActivities()).isEqualTo(10);
        assertThat(result.getAssessedActivities()).isEqualTo(2);
        assertThat(result.getUnknown()).isEqualTo(9);
    }
}
