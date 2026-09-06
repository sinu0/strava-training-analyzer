package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.model.WorkoutExecutionStatus;
import pl.strava.analizator.domain.model.WorkoutStep;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.port.WorkoutExecutionRepository;

@ExtendWith(MockitoExtension.class)
class WorkoutActivityMatchingServiceTest {
    private static final Instant START = Instant.parse("2026-09-03T16:00:00Z");
    @Mock WorkoutExecutionRepository executionRepository;
    @Mock TrainingPlanRepository planRepository;
    @Mock ActivityRepository activityRepository;
    @Mock pl.strava.analizator.domain.port.WorkoutExecutionEventRepository events;
    private WorkoutActivityMatchingService service;

    @BeforeEach
    void setUp() {
        service = new WorkoutActivityMatchingService(executionRepository, planRepository, activityRepository,
                Clock.fixed(START.plusSeconds(4000), ZoneOffset.UTC), events);
        when(executionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void restoredIntensityDoesNotEraseTimelineChanges() {
        WorkoutExecution execution = execution();
        int[] watts = new int[61];
        java.util.Arrays.fill(watts, 200);
        Activity activity = activity("Ride", 0, 60, watts, java.util.stream.IntStream.rangeClosed(0, 60).toArray())
                .toBuilder().deviceWatts(true).build();
        when(executionRepository.findById(execution.getId())).thenReturn(Optional.of(execution));
        when(activityRepository.findById(activity.getId())).thenReturn(Optional.of(activity));
        when(events.hasTimelineChanges(execution.getId())).thenReturn(true);
        assertThat(service.linkManually(execution.getId(), activity.getId()).getComplianceScore()).isNull();
    }

    @Test
    void linksOnlyCredibleCyclingActivityAndEvaluatesSnapshot() {
        WorkoutExecution execution = execution();
        int[] power = new int[61];
        java.util.Arrays.fill(power, 200);
        Activity matching = activity("Ride", 0, 60, power, java.util.stream.IntStream.rangeClosed(0, 60).toArray())
                .toBuilder().deviceWatts(true).build();
        Activity run = activity("Run", 30, 60, null, null);
        when(executionRepository.findCompletedWithoutActivity()).thenReturn(List.of(execution));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(run, matching));
        when(planRepository.findById(execution.getScheduledWorkoutId())).thenReturn(Optional.empty());

        service.matchImported(matching);

        org.mockito.ArgumentCaptor<WorkoutExecution> captor =
                org.mockito.ArgumentCaptor.forClass(WorkoutExecution.class);
        org.mockito.Mockito.verify(executionRepository).save(captor.capture());
        assertThat(captor.getValue().getActivityId()).isEqualTo(matching.getId());
        assertThat(captor.getValue().getActivityMatchStatus()).isEqualTo("AUTO");
        assertThat(captor.getValue().getComplianceStatus()).isEqualTo("COMPLETE");
        assertThat(captor.getValue().getComplianceScore()).isEqualTo(100);
        assertThat(captor.getValue().getComplianceAlgorithmVersion()).isEqualTo("workout-compliance-v2");
    }

    @Test
    void multipleCredibleCandidatesRemainAmbiguous() {
        WorkoutExecution execution = execution();
        Activity first = activity("Ride", 30, 60, null, null);
        Activity second = activity("VirtualRide", 90, 65, null, null);
        when(executionRepository.findCompletedWithoutActivity()).thenReturn(List.of(execution));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(first, second));
        when(planRepository.findById(execution.getScheduledWorkoutId())).thenReturn(Optional.empty());

        service.matchImported(first);

        org.mockito.ArgumentCaptor<WorkoutExecution> captor =
                org.mockito.ArgumentCaptor.forClass(WorkoutExecution.class);
        org.mockito.Mockito.verify(executionRepository).save(captor.capture());
        assertThat(captor.getValue().getActivityId()).isNull();
        assertThat(captor.getValue().getActivityMatchStatus()).isEqualTo("AMBIGUOUS");
        assertThat(captor.getValue().getComplianceScore()).isNull();
    }

    @Test
    void missingStreamsProducesUnknownInsteadOfArtificialZero() {
        WorkoutExecution execution = execution();
        Activity matching = activity("Ride", 60, 60, null, null);
        when(executionRepository.findCompletedWithoutActivity()).thenReturn(List.of(execution));
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(matching));
        when(planRepository.findById(execution.getScheduledWorkoutId())).thenReturn(Optional.empty());

        service.matchImported(matching);

        org.mockito.ArgumentCaptor<WorkoutExecution> captor =
                org.mockito.ArgumentCaptor.forClass(WorkoutExecution.class);
        org.mockito.Mockito.verify(executionRepository).save(captor.capture());
        assertThat(captor.getValue().getComplianceStatus()).isEqualTo("UNKNOWN");
        assertThat(captor.getValue().getComplianceScore()).isNull();
    }

    private WorkoutExecution execution() {
        return WorkoutExecution.builder().id(UUID.randomUUID()).scheduledWorkoutId(UUID.randomUUID())
                .workoutNameSnapshot("Snapshot").stepsSnapshot(List.of(WorkoutStep.builder()
                        .type("steady").durationSec(60).powerPctFtpLow(70).powerPctFtpHigh(80).build()))
                .ftpWatts(280).startedAt(START).finishedAt(START.plusSeconds(60))
                .status(WorkoutExecutionStatus.COMPLETED).workoutElapsedMs(60_000)
                .skippedStepIndexes(List.of()).repeatedStepIndexes(List.of())
                .activityMatchStatus("PENDING").complianceStatus("UNKNOWN")
                .complianceAlgorithmVersion("workout-compliance-v1").stateVersion(2)
                .createdAt(START).updatedAt(START.plusSeconds(60)).build();
    }

    private Activity activity(String sport, int startOffsetSec, int durationSec, int[] power, int[] time) {
        return Activity.builder().id(UUID.randomUUID()).sportType(sport).name(sport)
                .startedAt(OffsetDateTime.ofInstant(START.plusSeconds(startOffsetSec), ZoneOffset.UTC))
                .elapsedTimeSec(durationSec).powerStream(power).timeStream(time).build();
    }
}
