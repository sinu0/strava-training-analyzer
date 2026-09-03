package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.AnalysisBackfillState;
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
    private AnalysisBackfillService service;

    @BeforeEach void setUp() {
        service = new AnalysisBackfillService(states, segments, routes, activities, profiles,
                syncStates, source, segmentService, routeService);
        when(states.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void activeStravaRateLimitPausesWithoutCallingStrava() {
        when(states.find("SEGMENTS")).thenReturn(Optional.of(running()));
        when(syncStates.findFirst()).thenReturn(Optional.of(SyncState.builder().status("rate_limited")
                .rateLimitResetsAt(Instant.now().plusSeconds(300)).build()));

        service.processSegments();

        ArgumentCaptor<AnalysisBackfillState> saved = ArgumentCaptor.forClass(AnalysisBackfillState.class);
        verify(states).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo("RATE_LIMITED");
        verify(source, never()).fetchActivityForSegmentBackfill(any(), any());
    }

    @Test
    void expiredRateLimitResumesAndCompletesWhenNothingRemains() {
        when(states.find("SEGMENTS")).thenReturn(Optional.of(running().toBuilder().status("RATE_LIMITED")
                .rateLimitResetsAt(Instant.now().minusSeconds(1)).build()));
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
                .capability("UNKNOWN").total(10).updatedAt(Instant.now()).build();
    }
}
