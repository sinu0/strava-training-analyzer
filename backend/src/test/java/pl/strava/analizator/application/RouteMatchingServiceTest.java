package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.RouteFingerprint;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.RouteMatchRepository;

@ExtendWith(MockitoExtension.class)
class RouteMatchingServiceTest {
    @Mock RouteMatchRepository repository;
    @Mock ActivityRepository activities;

    @Test
    void persistsUnavailableFingerprintOnlyOnceForAnEmptyGpsRoute() {
        UUID activityId = UUID.randomUUID();
        AtomicReference<RouteFingerprint> persisted = new AtomicReference<>();
        when(repository.findMatchByActivity(activityId, RouteMatchingAlgorithm.VERSION)).thenReturn(Optional.empty());
        when(repository.findFingerprint(activityId, RouteMatchingAlgorithm.VERSION))
                .thenAnswer(ignored -> Optional.ofNullable(persisted.get()));
        when(repository.saveFingerprint(any())).thenAnswer(invocation -> {
            RouteFingerprint value = invocation.getArgument(0);
            persisted.set(value);
            return value;
        });
        RouteMatchingService service = new RouteMatchingService(repository, activities, new RouteMatchingAlgorithm());

        assertThat(service.matchActivity(Activity.builder().id(activityId).summaryPolyline("").build())).isEmpty();
        assertThat(service.matchActivity(Activity.builder().id(activityId).summaryPolyline("").build())).isEmpty();

        ArgumentCaptor<RouteFingerprint> saved = ArgumentCaptor.forClass(RouteFingerprint.class);
        verify(repository, org.mockito.Mockito.times(1)).saveFingerprint(saved.capture());
        assertThat(saved.getValue().getCapability()).isEqualTo("UNAVAILABLE");
        assertThat(saved.getValue().getDistanceM()).isNull();
    }
}
