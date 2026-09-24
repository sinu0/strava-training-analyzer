package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.SocketException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AnalysisBackfillState;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.SyncState;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AnalysisBackfillRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.RouteMatchRepository;
import pl.strava.analizator.domain.port.SegmentRepository;
import pl.strava.analizator.domain.port.SyncStateRepository;

@ExtendWith(MockitoExtension.class)
class AnalysisBackfillServiceTest {
    @Mock AnalysisBackfillRepository states;
    @Mock SegmentRepository segments;
    @Mock RouteMatchRepository routes;
    @Mock ActivityRepository activities;
    @Mock AthleteProfileRepository profiles;
    @Mock SyncStateRepository syncStates;
    @Mock SyncDataSource source;
    @Mock SegmentAnalysisService segmentService;
    @Mock RouteMatchingService routeService;
    private static final Instant NOW = Instant.parse("2026-09-24T10:00:00Z");
    private static final UUID ACTIVITY_ID = UUID.fromString("00000000-0000-0000-0000-000000000042");
    private AnalysisBackfillService service;

    @BeforeEach void setUp() {
        service = new AnalysisBackfillService(states, segments, routes, activities, profiles,
                syncStates, source, segmentService, routeService, Clock.fixed(NOW, ZoneOffset.UTC));
        lenient().when(states.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void activeStravaRateLimitPausesWithoutCallingStrava() {
        when(states.find("SEGMENTS")).thenReturn(Optional.of(running()));
        when(syncStates.findFirst()).thenReturn(Optional.of(SyncState.builder().status("rate_limited")
                .rateLimitResetsAt(NOW.plusSeconds(300)).build()));

        service.processSegments();

        ArgumentCaptor<AnalysisBackfillState> saved = ArgumentCaptor.forClass(AnalysisBackfillState.class);
        verify(states).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo("RATE_LIMITED");
        verify(source, never()).fetchActivityForSegmentBackfill(any(), any());
    }

    @Test
    void expiredRateLimitResumesAndCompletesWhenNothingRemains() {
        when(states.find("SEGMENTS")).thenReturn(Optional.of(running().toBuilder().status("RATE_LIMITED")
                .rateLimitResetsAt(NOW.minusSeconds(1)).build()));
        when(syncStates.findFirst()).thenReturn(Optional.empty());
        when(segments.findActivityIdsNeedingSegmentScan(1)).thenReturn(List.of());

        service.processSegments();

        ArgumentCaptor<AnalysisBackfillState> saved = ArgumentCaptor.forClass(AnalysisBackfillState.class);
        verify(states, org.mockito.Mockito.atLeast(2)).save(saved.capture());
        assertThat(saved.getAllValues().getLast().getStatus()).isEqualTo("COMPLETED");
    }

    @Test
    void retryAfterFailureKeepsPersistedProgressAndOriginalTotal() {
        AnalysisBackfillState failed = running().toBuilder().status("FAILED").processed(3).total(10).build();
        when(states.find("SEGMENTS")).thenReturn(Optional.of(failed));
        when(segments.countActivitiesNeedingSegmentScan()).thenReturn(7L);

        var resumed = service.start("segments");

        assertThat(resumed.getStatus()).isEqualTo("RUNNING");
        assertThat(resumed.getProcessed()).isEqualTo(3);
        assertThat(resumed.getTotal()).isEqualTo(10);
    }

    private AnalysisBackfillState running() {
        return AnalysisBackfillState.builder().jobType("SEGMENTS").status("RUNNING")
                .capability("UNKNOWN").total(10).updatedAt(NOW).build();
    }

    @Test
    void transientNetworkFailureSchedulesRetryInsteadOfFailing() {
        givenNextActivity(running().toBuilder().processed(270).build());
        when(source.fetchActivityForSegmentBackfill(any(), any()))
                .thenThrow(new TransientSourceException("Strava unreachable", new SocketException("Network is unreachable")));

        AnalysisBackfillState saved = processAndCaptureLast();

        assertThat(saved.getStatus()).isEqualTo("RETRYING");
        assertThat(saved.getAttemptCount()).isEqualTo(1);
        assertThat(saved.getRetryAt()).isEqualTo(NOW.plus(Duration.ofMinutes(1)));
        assertThat(saved.getProcessed()).isEqualTo(270);
    }

    @Test
    void untranslatedSocketCauseIsAlsoTreatedAsTransient() {
        givenNextActivity(running());
        when(source.fetchActivityForSegmentBackfill(any(), any()))
                .thenThrow(new IllegalStateException("I/O error", new SocketException("Network is unreachable")));

        assertThat(processAndCaptureLast().getStatus()).isEqualTo("RETRYING");
    }

    @Test
    void backoffDoublesAndIsCappedAtThirtyMinutes() {
        givenNextActivity(running().toBuilder().attemptCount(3).build());
        when(source.fetchActivityForSegmentBackfill(any(), any())).thenThrow(new TransientSourceException("down", null));
        assertThat(processAndCaptureLast().getRetryAt()).isEqualTo(NOW.plus(Duration.ofMinutes(8)));

        org.mockito.Mockito.reset(states);
        lenient().when(states.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(states.find("SEGMENTS")).thenReturn(Optional.of(running().toBuilder().attemptCount(6).build()));
        assertThat(processAndCaptureLast().getRetryAt()).isEqualTo(NOW.plus(Duration.ofMinutes(30)));
    }

    @Test
    void exhaustedRetriesEndInFailedState() {
        givenNextActivity(running().toBuilder().attemptCount(7).build());
        when(source.fetchActivityForSegmentBackfill(any(), any())).thenThrow(new TransientSourceException("down", null));

        AnalysisBackfillState saved = processAndCaptureLast();

        assertThat(saved.getStatus()).isEqualTo("FAILED");
        assertThat(saved.getRetryAt()).isNull();
    }

    @Test
    void permanentFailureFailsImmediately() {
        givenNextActivity(running());
        when(source.fetchActivityForSegmentBackfill(any(), any())).thenThrow(new IllegalStateException("bad payload"));

        assertThat(processAndCaptureLast().getStatus()).isEqualTo("FAILED");
    }

    @Test
    void scheduledRetryWaitsUntilRetryAt() {
        when(states.find("SEGMENTS")).thenReturn(Optional.of(running().toBuilder().status("RETRYING")
                .attemptCount(2).retryAt(NOW.plusSeconds(30)).build()));

        service.processSegments();

        verify(states, never()).save(any());
        verify(source, never()).fetchActivityForSegmentBackfill(any(), any());
    }

    @Test
    void scheduledRetryResumesWithoutUserActionAndResetsAttempts() {
        givenNextActivity(running().toBuilder().status("RETRYING").attemptCount(2).retryAt(NOW.minusSeconds(1)).build());
        when(source.fetchActivityForSegmentBackfill(any(), any())).thenReturn(Activity.builder()
                .externalId("987").segmentEfforts(List.of()).segmentDataAvailability("AVAILABLE").build());

        AnalysisBackfillState saved = processAndCaptureLast();

        assertThat(saved.getStatus()).isEqualTo("RUNNING");
        assertThat(saved.getAttemptCount()).isZero();
        assertThat(saved.getRetryAt()).isNull();
        assertThat(saved.getProcessed()).isEqualTo(1);
    }

    private void givenNextActivity(AnalysisBackfillState state) {
        when(states.find("SEGMENTS")).thenReturn(Optional.of(state));
        lenient().when(syncStates.findFirst()).thenReturn(Optional.empty());
        lenient().when(segments.findActivityIdsNeedingSegmentScan(1)).thenReturn(List.of(ACTIVITY_ID));
        lenient().when(activities.findById(ACTIVITY_ID)).thenReturn(Optional.of(Activity.builder()
                .id(ACTIVITY_ID).externalId("987").build()));
        lenient().when(profiles.findFirst()).thenReturn(Optional.of(AthleteProfile.builder().build()));
    }

    private AnalysisBackfillState processAndCaptureLast() {
        service.processSegments();
        ArgumentCaptor<AnalysisBackfillState> saved = ArgumentCaptor.forClass(AnalysisBackfillState.class);
        verify(states, org.mockito.Mockito.atLeastOnce()).save(saved.capture());
        return saved.getAllValues().getLast();
    }
}
