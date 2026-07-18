package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.ActivityCorePage;
import pl.strava.analizator.domain.model.ActivityCoreView;
import pl.strava.analizator.domain.port.ActivityReadRepository;
import pl.strava.analizator.infrastructure.persistence.jpa.ActivityCoreProjection;
import pl.strava.analizator.infrastructure.persistence.jpa.ActivityJpaRepository;

@Component
@RequiredArgsConstructor
public class ActivityReadRepositoryAdapter implements ActivityReadRepository {

    private final ActivityJpaRepository jpaRepository;

    @Override
    public ActivityCorePage findSummaries(String sportType, OffsetDateTime from, OffsetDateTime to,
                                          int page, int size) {
        var result = jpaRepository.findV2Summaries(sportType, from, to, PageRequest.of(page, size));
        return new ActivityCorePage(
                result.getContent().stream().map(this::toDomain).toList(),
                result.getTotalElements(), result.getNumber(), result.getSize(), result.getTotalPages());
    }

    @Override
    public Optional<ActivityCoreView> findCoreById(UUID id) {
        return jpaRepository.findV2CoreById(id).map(this::toDomain);
    }

    private ActivityCoreView toDomain(ActivityCoreProjection projection) {
        return ActivityCoreView.builder()
                .id(projection.getId())
                .externalId(projection.getExternalId())
                .source(projection.getSource())
                .sportType(projection.getSportType())
                .name(projection.getName())
                .description(projection.getDescription())
                .startedAt(projection.getStartedAt())
                .elapsedTimeSec(projection.getElapsedTimeSec())
                .movingTimeSec(projection.getMovingTimeSec())
                .distanceM(projection.getDistanceM())
                .elevationGainM(projection.getElevationGainM())
                .elevationLossM(projection.getElevationLossM())
                .avgSpeedMs(projection.getAvgSpeedMs())
                .maxSpeedMs(projection.getMaxSpeedMs())
                .avgHeartrate(projection.getAvgHeartrate())
                .maxHeartrate(projection.getMaxHeartrate())
                .avgPowerW(projection.getAvgPowerW())
                .maxPowerW(projection.getMaxPowerW())
                .avgCadence(projection.getAvgCadence())
                .maxCadence(projection.getMaxCadence())
                .calories(projection.getCalories())
                .avgTempC(projection.getAvgTempC())
                .summaryPolyline(projection.getSummaryPolyline())
                .createdAt(projection.getCreatedAt())
                .updatedAt(projection.getUpdatedAt())
                .build();
    }
}
