package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityRepository;

@Service
@RequiredArgsConstructor
public class SeasonWrappedService {

    private final ActivityRepository activityRepository;
    private final StreakService streakService;

    @Transactional(readOnly = true)
    public Map<String, Object> generate(int year) {
        OffsetDateTime from = OffsetDateTime.of(year, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime to = OffsetDateTime.of(year + 1, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);

        List<Activity> activities = activityRepository.findByStartedAtBetween(from, to);

        double totalKm = activities.stream().mapToDouble(a -> toDouble(a.getDistanceM()) / 1000.0).sum();
        double totalElevation = activities.stream().mapToDouble(a -> toDouble(a.getElevationGainM())).sum();
        double totalHours = activities.stream()
                .mapToDouble(a -> a.getMovingTimeSec() != null ? a.getMovingTimeSec() / 3600.0 : 0).sum();
        int totalRides = activities.size();

        // Longest ride
        var longestRide = activities.stream()
                .max(Comparator.comparing(a -> toDouble(a.getDistanceM())))
                .orElse(null);

        // Most elevation single
        var mostElevation = activities.stream()
                .max(Comparator.comparing(a -> toDouble(a.getElevationGainM())))
                .orElse(null);

        // Best month (by total TSS estimation via hours*30)
        Map<String, Double> monthHours = new LinkedHashMap<>();
        for (var a : activities) {
            if (a.getStartedAt() != null) {
                String month = String.format("%02d", a.getStartedAt().getMonthValue());
                monthHours.merge(month, a.getMovingTimeSec() != null ? a.getMovingTimeSec() / 3600.0 : 0, Double::sum);
            }
        }
        String bestMonth = monthHours.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("—");
        String bestMonthLabel = getMonthLabel(bestMonth);

        // Favorite time of day
        Map<String, Long> hours = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> String.format("%02d:00", a.getStartedAt().toLocalTime().getHour()),
                        Collectors.counting()));
        String favoriteTime = hours.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("—");

        // Favorite day of week
        Map<String, Long> days = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> getDayLabel(a.getStartedAt().getDayOfWeek()),
                        Collectors.counting()));
        String favoriteDay = days.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("—");

        // Streak stats
        var streakStats = streakService.getStreakStats();
        int longestStreak = ((Number) streakStats.get("longestStreak")).intValue();
        int totalActiveDays = ((Number) streakStats.get("totalActiveDays")).intValue();

        // Fun facts
        String distanceFun = String.format("%s × Warszawa–Kraków (300 km)", roundStr(totalKm / 300.0));
        String elevationFun = String.format("%s × Rysy (2499 m n.p.m.)", roundStr(totalElevation / 2499.0));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("year", year);
        result.put("totalKm", round(totalKm));
        result.put("totalElevation", round(totalElevation));
        result.put("totalHours", round(totalHours));
        result.put("totalRides", totalRides);
        result.put("bestMonth", bestMonthLabel);
        result.put("favoriteTime", favoriteTime);
        result.put("favoriteDay", favoriteDay);
        result.put("longestStreak", longestStreak);
        result.put("totalActiveDays", totalActiveDays);
        result.put("averageKmPerRide", totalRides > 0 ? round(totalKm / totalRides) : 0);
        result.put("distanceFun", distanceFun);
        result.put("elevationFun", elevationFun);

        if (longestRide != null) {
            result.put("longestRideKm", round(toDouble(longestRide.getDistanceM()) / 1000.0));
            result.put("longestRideName", longestRide.getName());
        }
        if (mostElevation != null) {
            result.put("mostElevationM", round(toDouble(mostElevation.getElevationGainM())));
            result.put("mostElevationName", mostElevation.getName());
        }

        return result;
    }

    public List<Integer> getAvailableYears() {
        List<Activity> all = activityRepository.findAll();
        return all.stream()
                .filter(a -> a.getStartedAt() != null)
                .map(a -> a.getStartedAt().getYear())
                .distinct()
                .sorted()
                .toList();
    }

    private double toDouble(BigDecimal v) { return v != null ? v.doubleValue() : 0.0; }
    private double round(double v) { return Math.round(v * 10.0) / 10.0; }
    private String roundStr(double v) { return String.format("%.1f", v); }

    private String getDayLabel(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "Poniedziałek";
            case TUESDAY -> "Wtorek";
            case WEDNESDAY -> "Środa";
            case THURSDAY -> "Czwartek";
            case FRIDAY -> "Piątek";
            case SATURDAY -> "Sobota";
            case SUNDAY -> "Niedziela";
        };
    }

    private String getMonthLabel(String mm) {
        return switch (mm) {
            case "01" -> "Styczeń"; case "02" -> "Luty"; case "03" -> "Marzec";
            case "04" -> "Kwiecień"; case "05" -> "Maj"; case "06" -> "Czerwiec";
            case "07" -> "Lipiec"; case "08" -> "Sierpień"; case "09" -> "Wrzesień";
            case "10" -> "Październik"; case "11" -> "Listopad"; case "12" -> "Grudzień";
            default -> mm;
        };
    }
}
