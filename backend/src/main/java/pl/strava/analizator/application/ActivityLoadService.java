package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;

/** Recorded load only; an absent metric is not an inferred zero. */
@RequiredArgsConstructor
public class ActivityLoadService {
    private final ActivityMetricRepository metrics;

    public Map<UUID, BigDecimal> getLoads(List<Activity> activities) {
        if (activities.isEmpty()) return Map.of();
        var ids = activities.stream().map(Activity::getId).toList();
        var power = metrics.findNumericValues(ids, "training_stress_score");
        var heartRate = metrics.findNumericValues(ids, "hr_training_stress_score");
        Map<UUID, BigDecimal> result = new LinkedHashMap<>();
        for (Activity activity : activities) {
            BigDecimal load = Boolean.TRUE.equals(activity.getDeviceWatts()) ? power.get(activity.getId()) : null;
            if (load == null) load = heartRate.get(activity.getId());
            if (load != null) result.put(activity.getId(), load);
        }
        return result;
    }
}
