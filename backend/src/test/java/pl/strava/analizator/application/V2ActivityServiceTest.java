package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.ActivityCorePage;
import pl.strava.analizator.domain.model.ActivityCoreView;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityReadRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.ActivityTrainingEffectRepository;

@ExtendWith(MockitoExtension.class)
class V2ActivityServiceTest {

    @Mock private ActivityReadRepository activityReadRepository;
    @Mock private ActivityRepository activityRepository;
    @Mock private ActivityMetricRepository metricRepository;
    @Mock private ActivityTrainingEffectRepository trainingEffectRepository;

    private V2ActivityService service;

    @BeforeEach
    void setUp() {
        service = new V2ActivityService(activityReadRepository, activityRepository,
                metricRepository, trainingEffectRepository);
    }

    @Test
    void listUsesLightProjectionAndOneBatchForTrainingEffects() {
        UUID id = UUID.randomUUID();
        ActivityCoreView summary = ActivityCoreView.builder()
                .id(id)
                .name("Lekka projekcja")
                .startedAt(OffsetDateTime.now())
                .build();
        when(activityReadRepository.findSummaries(isNull(), any(OffsetDateTime.class),
                any(OffsetDateTime.class), eq(0), eq(20)))
                .thenReturn(new ActivityCorePage(List.of(summary), 1, 0, 20, 1));
        when(trainingEffectRepository.findByActivityIds(List.of(id))).thenReturn(Map.of());

        var result = service.findActivities(null, null, null, 0, 20);

        assertThat(result.getItems()).singleElement()
                .extracting(item -> item.getName()).isEqualTo("Lekka projekcja");
        verify(activityRepository, never()).findAll();
        verify(trainingEffectRepository).findByActivityIds(List.of(id));
        ArgumentCaptor<OffsetDateTime> from = ArgumentCaptor.forClass(OffsetDateTime.class);
        ArgumentCaptor<OffsetDateTime> to = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(activityReadRepository).findSummaries(isNull(), from.capture(), to.capture(), eq(0), eq(20));
        assertThat(from.getValue()).isBefore(summary.getStartedAt());
        assertThat(to.getValue()).isAfter(summary.getStartedAt());
    }

    @Test
    void streamsAreLoadedOnlyOnDemandAndDownsampled() {
        UUID id = UUID.randomUUID();
        Activity activity = Activity.builder()
                .id(id)
                .timeStream(new int[]{0, 1, 2, 3, 4})
                .powerStream(new int[]{100, 110, 120, 130, 140})
                .heartrateStream(new int[]{120, 121, 122, 123, 124})
                .build();
        when(activityRepository.findById(id)).thenReturn(Optional.of(activity));

        var result = service.findStreams(id, "power", "50");

        assertThat(result.getPower()).containsExactly(100, 110, 120, 130, 140);
        assertThat(result.getHeartrate()).isNull();
        assertThat(result.getReturnedPoints()).isEqualTo(5);
    }

    @Test
    void streamsLimitLargeResponsesByDefault() {
        UUID id = UUID.randomUUID();
        int[] values = new int[7_597];
        for (int index = 0; index < values.length; index++) values[index] = index;
        Activity activity = Activity.builder().id(id).timeStream(values).powerStream(values).build();
        when(activityRepository.findById(id)).thenReturn(Optional.of(activity));

        var result = service.findStreams(id, "power", null);

        assertThat(result.getOriginalPoints()).isEqualTo(7_597);
        assertThat(result.getReturnedPoints()).isLessThanOrEqualTo(1_000);
    }
}
