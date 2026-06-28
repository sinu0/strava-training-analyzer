package pl.strava.analizator.application;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityRepository;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final ActivityRepository activityRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getActivityCalendar(int year) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);

        List<Activity> activities = activityRepository.findByStartedAtBetween(
                OffsetDateTime.of(start.atStartOfDay(), ZoneOffset.UTC),
                OffsetDateTime.of(end.plusDays(1).atStartOfDay(), ZoneOffset.UTC));

        Set<LocalDate> activeDays = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .map(a -> a.getStartedAt().toLocalDate())
                .collect(Collectors.toSet());

        Map<LocalDate, Double> tssByDay = new LinkedHashMap<>();
        for (var a : activities) {
            if (a.getStartedAt() != null) {
                LocalDate day = a.getStartedAt().toLocalDate();
                tssByDay.merge(day, 1.0, Double::sum);
            }
        }

        List<Map<String, Object>> weeks = new ArrayList<>();
        LocalDate weekStart = start.with(DayOfWeek.MONDAY);
        if (weekStart.isBefore(start)) weekStart = weekStart.plusWeeks(1).with(DayOfWeek.MONDAY);

        while (weekStart.isBefore(end) || weekStart.equals(end)) {
            List<Map<String, Object>> days = new ArrayList<>();
            for (int d = 0; d < 7; d++) {
                LocalDate date = weekStart.plusDays(d);
                int level = 0;
                if (activeDays.contains(date)) {
                    level = (int) Math.min(4, tssByDay.getOrDefault(date, 0.0));
                }
                days.add(Map.of("date", date.toString(), "level", level));
            }
            weeks.add(Map.of("days", days));
            weekStart = weekStart.plusWeeks(1);
        }

        return Map.of("year", year, "weeks", weeks);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStreakStats() {
        List<Activity> activities = activityRepository.findAll();

        Set<LocalDate> activeDays = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .map(a -> a.getStartedAt().toLocalDate())
                .collect(Collectors.toSet());

        List<LocalDate> sorted = new ArrayList<>(activeDays);
        sorted.sort(null);

        int currentStreak = 0;
        if (!sorted.isEmpty()) {
            currentStreak = 1;
            for (int i = sorted.size() - 1; i > 0; i--) {
                if (sorted.get(i).equals(sorted.get(i - 1).plusDays(1))) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        int longestStreak = 0;
        int streak = sorted.isEmpty() ? 0 : 1;
        for (int i = 1; i < sorted.size(); i++) {
            if (sorted.get(i).equals(sorted.get(i - 1).plusDays(1))) {
                streak++;
            } else {
                if (streak > longestStreak) longestStreak = streak;
                streak = 1;
            }
        }
        if (streak > longestStreak) longestStreak = streak;

        return Map.of(
                "currentStreak", currentStreak,
                "longestStreak", longestStreak,
                "totalActiveDays", activeDays.size()
        );
    }
}
