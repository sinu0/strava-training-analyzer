package pl.strava.analizator.application;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.ActivityDataQualityDto;
import pl.strava.analizator.application.dto.DataQualitySummaryDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.ActivityDataQuality;
import pl.strava.analizator.domain.model.ActivityDataQualityPolicy;
import pl.strava.analizator.domain.port.ActivityDataQualityRepository;
import pl.strava.analizator.domain.port.ActivityRepository;

@Service
@RequiredArgsConstructor
public class ActivityDataQualityService {
    private final ActivityDataQualityRepository qualityRepository;
    private final ActivityRepository activityRepository;

    public ActivityDataQuality assessAndSave(Activity activity) {
        List<String> issues = new ArrayList<>();
        if (activity.getTimeStream() == null || activity.getTimeStream().length == 0) issues.add("MISSING_TIME_STREAM");
        if (!hasTrainingStream(activity)) issues.add("MISSING_TRAINING_STREAM");
        if (!routeIsConsistent(activity)) issues.add("INCONSISTENT_ROUTE_DATA");
        if (activity.getMaxPowerW() != null
                && !ActivityDataQualityPolicy.isPlausiblePower(activity.getMaxPowerW(), 5)) issues.add("IMPLAUSIBLE_POWER");
        if (activity.getMaxSpeedMs() != null
                && !ActivityDataQualityPolicy.isPlausibleSpeedKmh(activity.getMaxSpeedMs().doubleValue() * 3.6)) issues.add("IMPLAUSIBLE_SPEED");
        String status = issues.contains("MISSING_TIME_STREAM") ? "UNKNOWN" : issues.isEmpty() ? "AVAILABLE" : "PARTIAL";
        return qualityRepository.save(ActivityDataQuality.builder()
                .activityId(activity.getId()).status(status).issues(List.copyOf(issues)).assessedAt(Instant.now()).build());
    }

    public ActivityDataQualityDto get(UUID activityId) {
        ActivityDataQuality quality = qualityRepository.findByActivityId(activityId).orElseGet(() -> {
            Activity activity = activityRepository.findById(activityId)
                    .orElseThrow(() -> new ActivityNotFoundException("Activity not found: " + activityId));
            return assessAndSave(activity);
        });
        return ActivityDataQualityDto.from(quality);
    }

    public DataQualitySummaryDto summary() {
        List<ActivityDataQuality> all = qualityRepository.findAll();
        long totalActivities = activityRepository.count();
        long explicitlyUnknown = all.stream().filter(item -> "UNKNOWN".equals(item.getStatus())).count();
        long unassessed = Math.max(0, totalActivities - all.size());
        return DataQualitySummaryDto.builder()
                .totalActivities(totalActivities)
                .assessedActivities(all.size())
                .available(all.stream().filter(item -> "AVAILABLE".equals(item.getStatus())).count())
                .partial(all.stream().filter(item -> "PARTIAL".equals(item.getStatus())).count())
                .unknown(explicitlyUnknown + unassessed)
                .build();
    }

    private boolean hasTrainingStream(Activity activity) {
        return hasValues(activity.getPowerStream()) || hasValues(activity.getHeartrateStream())
                || hasValues(activity.getCadenceStream()) || hasValues(activity.getDistanceStream())
                || hasValues(activity.getVelocityStream());
    }

    private boolean routeIsConsistent(Activity activity) {
        boolean lat = hasValues(activity.getLatStream());
        boolean lng = hasValues(activity.getLngStream());
        boolean polyline = activity.getSummaryPolyline() != null && !activity.getSummaryPolyline().isBlank();
        return (!lat && !lng && !polyline) || (lat && lng && polyline);
    }

    private boolean hasValues(int[] values) { return values != null && values.length > 0; }
    private boolean hasValues(double[] values) { return values != null && values.length > 0; }
}
