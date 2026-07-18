package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import pl.strava.analizator.domain.gamification.PersonalRecord;
import pl.strava.analizator.domain.gamification.PersonalRecordType;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.ActivityDataQualityPolicy;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.PersonalRecordRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class PersonalRecordService {

    private final PersonalRecordRepository recordRepository;
    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository metricRepository;

    @Transactional
    public List<PersonalRecord> detectNewRecords() {
        List<PersonalRecord> existingRecords = recordRepository.findAll();
        Map<PersonalRecordType, Double> currentBests = existingRecords.stream()
                .collect(Collectors.toMap(
                        PersonalRecord::getRecordType,
                        PersonalRecord::getRecordValue,
                        Math::max));

        List<Activity> activities = activityRepository.findAll();
        List<PersonalRecord> newRecords = new ArrayList<>();

        List<Activity> bikeActivities = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .filter(a -> a.getSportType() == null || !a.getSportType().equalsIgnoreCase("VirtualRide"))
                .sorted(Comparator.comparing(Activity::getStartedAt))
                .toList();

        checkPowerRecords(bikeActivities, currentBests, newRecords);
        checkDistanceRecords(bikeActivities, currentBests, newRecords);
        checkElevationRecords(bikeActivities, currentBests, newRecords);
        checkSpeedRecords(bikeActivities, currentBests, newRecords);
        checkDurationRecords(bikeActivities, currentBests, newRecords);
        checkWeeklyRecords(bikeActivities, currentBests, newRecords);
        checkStreakRecords(bikeActivities, currentBests, newRecords);
        checkTssRecords(bikeActivities, currentBests, newRecords);

        for (PersonalRecord pr : newRecords) {
            recordRepository.save(pr);
        }

        if (!newRecords.isEmpty()) {
            log.info("Detected {} new personal records", newRecords.size());
        }

        return newRecords;
    }

    public List<PersonalRecord> getAllRecords() {
        return recordRepository.findAll().stream()
                .sorted(Comparator.comparing(PersonalRecord::getAchievedAt).reversed())
                .toList();
    }

    public List<PersonalRecord> getRecentRecords(int days) {
        return recordRepository.findRecent(days);
    }

    private void checkPowerRecords(List<Activity> activities, Map<PersonalRecordType, Double> bests,
                                   List<PersonalRecord> newRecords) {
        checkSingleActivityRecord(activities, bests, newRecords, PersonalRecordType.BEST_5S_POWER,
                a -> findPowerCurveEffort(a, 5), "best 5s power");
        checkSingleActivityRecord(activities, bests, newRecords, PersonalRecordType.BEST_1MIN_POWER,
                a -> findPowerCurveEffort(a, 60), "best 1min power");
        checkSingleActivityRecord(activities, bests, newRecords, PersonalRecordType.BEST_5MIN_POWER,
                a -> findPowerCurveEffort(a, 300), "best 5min power");
        checkSingleActivityRecord(activities, bests, newRecords, PersonalRecordType.BEST_20MIN_POWER,
                a -> findPowerCurveEffort(a, 1200), "best 20min power");
    }

    private void checkDistanceRecords(List<Activity> activities, Map<PersonalRecordType, Double> bests,
                                      List<PersonalRecord> newRecords) {
        checkSingleActivityRecord(activities, bests, newRecords, PersonalRecordType.LONGEST_RIDE,
                a -> toDouble(a.getDistanceM()) / 1000.0, "distance km");
    }

    private void checkElevationRecords(List<Activity> activities, Map<PersonalRecordType, Double> bests,
                                       List<PersonalRecord> newRecords) {
        checkSingleActivityRecord(activities, bests, newRecords, PersonalRecordType.MOST_ELEVATION_SINGLE,
                a -> toDouble(a.getElevationGainM()), "elevation");
    }

    private void checkSpeedRecords(List<Activity> activities, Map<PersonalRecordType, Double> bests,
                                   List<PersonalRecord> newRecords) {
        checkSingleActivityRecord(activities, bests, newRecords, PersonalRecordType.FASTEST_AVG_SPEED,
                a -> toDouble(a.getAvgSpeedMs()) * 3.6, "avg speed km/h");

        checkSingleActivityRecord(activities, bests, newRecords, PersonalRecordType.FASTEST_40KM,
                this::estimate40kmSpeed, "40km speed");
    }

    private void checkDurationRecords(List<Activity> activities, Map<PersonalRecordType, Double> bests,
                                      List<PersonalRecord> newRecords) {
        checkSingleActivityRecord(activities, bests, newRecords, PersonalRecordType.LONGEST_DURATION,
                a -> a.getMovingTimeSec() != null ? a.getMovingTimeSec() / 60.0 : null, "duration min");
    }

    private void checkWeeklyRecords(List<Activity> activities, Map<PersonalRecordType, Double> bests,
                                    List<PersonalRecord> newRecords) {
        Map<LocalDate, Double> weeklyHours = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getStartedAt().toLocalDate().with(DayOfWeek.MONDAY),
                        Collectors.summingDouble(a -> a.getMovingTimeSec() != null ? a.getMovingTimeSec() / 3600.0 : 0)
                ));

        if (!weeklyHours.isEmpty()) {
            var maxWeek = weeklyHours.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElse(null);

            if (maxWeek != null) {
                double current = maxWeek.getValue();
                double previous = bests.getOrDefault(PersonalRecordType.MOST_WEEKLY_HOURS, 0.0);
                if (current > previous) {
                    newRecords.add(PersonalRecord.builder()
                            .recordType(PersonalRecordType.MOST_WEEKLY_HOURS)
                            .recordValue(Math.round(current * 10.0) / 10.0)
                            .achievedAt(maxWeek.getKey())
                            .previousValue(previous > 0 ? previous : null)
                            .improvementPercent(previous > 0 ? Math.round((current - previous) / previous * 1000.0) / 10.0 : null)
                            .build());
                }
            }
        }

        Map<LocalDate, Double> weeklyElevation = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getStartedAt().toLocalDate().with(DayOfWeek.MONDAY),
                        Collectors.summingDouble(a -> toDouble(a.getElevationGainM()))
                ));

        if (!weeklyElevation.isEmpty()) {
            var maxWeek = weeklyElevation.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElse(null);

            if (maxWeek != null) {
                double current = maxWeek.getValue();
                double previous = bests.getOrDefault(PersonalRecordType.MOST_ELEVATION_WEEK, 0.0);
                if (current > previous) {
                    newRecords.add(PersonalRecord.builder()
                            .recordType(PersonalRecordType.MOST_ELEVATION_WEEK)
                            .recordValue(Math.round(current))
                            .achievedAt(maxWeek.getKey())
                            .previousValue(previous > 0 ? previous : null)
                            .improvementPercent(previous > 0 ? Math.round((current - previous) / previous * 1000.0) / 10.0 : null)
                            .build());
                }
            }
        }
    }

    private void checkStreakRecords(List<Activity> activities, Map<PersonalRecordType, Double> bests,
                                    List<PersonalRecord> newRecords) {
        Set<LocalDate> activeDays = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .map(a -> a.getStartedAt().toLocalDate())
                .collect(Collectors.toSet());

        List<LocalDate> sorted = new ArrayList<>(activeDays);
        sorted.sort(null);

        int maxStreak = 0;
        int currentStreak = sorted.isEmpty() ? 0 : 1;
        for (int i = 1; i < sorted.size(); i++) {
            if (sorted.get(i).equals(sorted.get(i - 1).plusDays(1))) {
                currentStreak++;
            } else {
                if (currentStreak > maxStreak) maxStreak = currentStreak;
                currentStreak = 1;
            }
        }
        if (currentStreak > maxStreak) maxStreak = currentStreak;

        if (maxStreak > 0) {
            double previous = bests.getOrDefault(PersonalRecordType.LONGEST_STREAK_DAYS, 0.0);
            if (maxStreak > previous) {
                newRecords.add(PersonalRecord.builder()
                        .recordType(PersonalRecordType.LONGEST_STREAK_DAYS)
                        .recordValue(maxStreak)
                        .achievedAt(LocalDate.now())
                        .previousValue(previous > 0 ? previous : null)
                        .improvementPercent(previous > 0 ? Math.round((maxStreak - previous) / previous * 1000.0) / 10.0 : null)
                        .build());
            }
        }

        Map<LocalDate, Long> weeks = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getStartedAt().toLocalDate().with(DayOfWeek.MONDAY),
                        Collectors.counting()
                ));

        List<LocalDate> activeWeeks = new ArrayList<>(weeks.keySet());
        activeWeeks.sort(null);
        int maxWeekStreak = 0;
        int currentWeekStreak = activeWeeks.isEmpty() ? 0 : 1;
        for (int i = 1; i < activeWeeks.size(); i++) {
            if (activeWeeks.get(i).equals(activeWeeks.get(i - 1).plusWeeks(1))) {
                currentWeekStreak++;
            } else {
                if (currentWeekStreak > maxWeekStreak) maxWeekStreak = currentWeekStreak;
                currentWeekStreak = 1;
            }
        }
        if (currentWeekStreak > maxWeekStreak) maxWeekStreak = currentWeekStreak;

        if (maxWeekStreak > 0) {
            double previous = bests.getOrDefault(PersonalRecordType.LONGEST_STREAK_WEEKS, 0.0);
            if (maxWeekStreak > previous) {
                newRecords.add(PersonalRecord.builder()
                        .recordType(PersonalRecordType.LONGEST_STREAK_WEEKS)
                        .recordValue(maxWeekStreak)
                        .achievedAt(LocalDate.now())
                        .previousValue(previous > 0 ? previous : null)
                        .improvementPercent(previous > 0 ? Math.round((maxWeekStreak - previous) / previous * 1000.0) / 10.0 : null)
                        .build());
            }
        }
    }

    private void checkTssRecords(List<Activity> activities, Map<PersonalRecordType, Double> bests,
                                 List<PersonalRecord> newRecords) {
        var activityIds = activities.stream().map(Activity::getId).toList();
        var tssMap = metricRepository.findNumericValues(activityIds, "training_stress_score");

        for (var a : activities) {
            var tss = tssMap.get(a.getId());
            if (tss != null) {
                double current = tss.doubleValue();
                double previous = bests.getOrDefault(PersonalRecordType.HIGHEST_TSS_SESSION, 0.0);
                if (current > previous) {
                    newRecords.add(PersonalRecord.builder()
                            .recordType(PersonalRecordType.HIGHEST_TSS_SESSION)
                            .recordValue(Math.round(current))
                            .activityId(a.getId())
                            .achievedAt(a.getStartedAt().toLocalDate())
                            .previousValue(previous > 0 ? previous : null)
                            .improvementPercent(previous > 0 ? Math.round((current - previous) / previous * 1000.0) / 10.0 : null)
                            .build());
                    bests.put(PersonalRecordType.HIGHEST_TSS_SESSION, current);
                }
            }
        }
    }

    private void checkSingleActivityRecord(List<Activity> activities, Map<PersonalRecordType, Double> bests,
                                           List<PersonalRecord> newRecords, PersonalRecordType type,
                                           java.util.function.Function<Activity, Double> extractor, String label) {
        double previous = bests.getOrDefault(type, 0.0);

        for (var a : activities) {
            Double val = extractor.apply(a);
            if (val == null || val <= previous || !isPlausible(type, val)) continue;
            newRecords.add(PersonalRecord.builder()
                    .recordType(type)
                    .recordValue(Math.round(val * 10.0) / 10.0)
                    .activityId(a.getId())
                    .achievedAt(a.getStartedAt().toLocalDate())
                    .previousValue(previous > 0 ? previous : null)
                    .improvementPercent(previous > 0 ? Math.round((val - previous) / previous * 1000.0) / 10.0 : null)
                    .build());
            previous = val;
            bests.put(type, val);
        }
    }

    private boolean isPlausible(PersonalRecordType type, double value) {
        return switch (type) {
            case BEST_5S_POWER -> ActivityDataQualityPolicy.isPlausiblePower(value, 5);
            case BEST_1MIN_POWER -> ActivityDataQualityPolicy.isPlausiblePower(value, 60);
            case BEST_5MIN_POWER -> ActivityDataQualityPolicy.isPlausiblePower(value, 300);
            case BEST_20MIN_POWER -> ActivityDataQualityPolicy.isPlausiblePower(value, 1200);
            case FASTEST_AVG_SPEED, FASTEST_40KM -> ActivityDataQualityPolicy.isPlausibleSpeedKmh(value);
            case LONGEST_RIDE -> ActivityDataQualityPolicy.isPlausiblePositive(value, 1_500);
            case MOST_ELEVATION_SINGLE, MOST_ELEVATION_WEEK ->
                    ActivityDataQualityPolicy.isPlausiblePositive(value, 30_000);
            case LONGEST_DURATION -> ActivityDataQualityPolicy.isPlausiblePositive(value, 48 * 60);
            case MOST_WEEKLY_HOURS -> ActivityDataQualityPolicy.isPlausiblePositive(value, 168);
            case LONGEST_STREAK_DAYS, LONGEST_STREAK_WEEKS ->
                    ActivityDataQualityPolicy.isPlausiblePositive(value, 20_000);
            case HIGHEST_TSS_SESSION -> ActivityDataQualityPolicy.isPlausiblePositive(value, 1_000);
        };
    }

    private Double estimate40kmSpeed(Activity activity) {
        double[] distance = activity.getDistanceStream();
        int[] time = activity.getTimeStream();
        if (distance == null || time == null || distance.length != time.length || distance.length < 2) {
            return null;
        }

        double bestKmh = 0;
        int end = 1;
        for (int start = 0; start < distance.length - 1; start++) {
            if (end <= start) end = start + 1;
            while (end < distance.length && distance[end] - distance[start] < 40_000) {
                end++;
            }
            if (end >= distance.length) break;
            int durationSeconds = time[end] - time[start];
            if (durationSeconds > 0) {
                bestKmh = Math.max(bestKmh, 40.0 / (durationSeconds / 3600.0));
            }
        }
        return bestKmh > 0 ? bestKmh : null;
    }

    private Double findPowerCurveEffort(Activity activity, int durationSeconds) {
        try {
            Optional<Map<String, Object>> curve = metricRepository.findJsonValue(activity.getId(), "power_curve");
            if (curve.isEmpty()) return null;
            Object effortsValue = curve.get().get("efforts");
            if (!(effortsValue instanceof Map<?, ?> efforts)) return null;
            Object value = efforts.get(String.valueOf(durationSeconds));
            if (value == null) value = efforts.get(durationSeconds);
            return value instanceof Number number ? number.doubleValue() : null;
        } catch (RuntimeException exception) {
            log.debug("Could not read power curve for activity {}: {}", activity.getId(), exception.getMessage());
            return null;
        }
    }

    private double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : 0.0;
    }
}
