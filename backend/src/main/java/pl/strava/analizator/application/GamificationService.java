package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.AchievementDto;
import pl.strava.analizator.domain.gamification.Achievement;
import pl.strava.analizator.domain.gamification.AchievementType;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.AchievementRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final AchievementRepository achievementRepository;
    private final ActivityRepository activityRepository;
    private final AthleteProfileRepository profileRepository;

    private static final List<Achievement> ALL_DEFINITIONS = buildDefinitions();

    public List<AchievementDto> getAchievements() {
        Map<String, Achievement> storedMap = achievementRepository.findAll().stream()
                .collect(Collectors.toMap(Achievement::getId, a -> a));

        return ALL_DEFINITIONS.stream()
                .map(def -> mergeWithStored(def, storedMap.get(def.getId())))
                .map(this::toDto)
                .toList();
    }

    public List<AchievementDto> evaluateAll() {
        List<Activity> activities = activityRepository.findAll();
        Map<LocalDate, WeekStats> weeklyStats = computeWeeklyStats(activities);
        int ftp = getFtp();

        Map<String, Boolean> conditions = evaluateConditions(activities, weeklyStats, ftp);

        for (Achievement def : ALL_DEFINITIONS) {
            boolean alreadyUnlocked = achievementRepository.findById(def.getId())
                    .map(Achievement::isUnlocked)
                    .orElse(false);

            if (!alreadyUnlocked && Boolean.TRUE.equals(conditions.get(def.getId()))) {
                achievementRepository.save(Achievement.builder()
                        .id(def.getId())
                        .name(def.getName())
                        .description(def.getDescription())
                        .icon(def.getIcon())
                        .type(def.getType())
                        .unlocked(true)
                        .unlockedAt(LocalDate.now())
                        .build());
            }
        }

        return getAchievements();
    }

    private Map<String, Boolean> evaluateConditions(List<Activity> activities,
            Map<LocalDate, WeekStats> weeklyStats, int ftp) {
        double totalElevation = weeklyStats.values().stream()
                .mapToDouble(WeekStats::totalElevationM).sum();

        return Map.of(
                "weekly-100km", weeklyStats.values().stream().anyMatch(w -> w.totalDistanceM() >= 100_000),
                "weekly-200km", weeklyStats.values().stream().anyMatch(w -> w.totalDistanceM() >= 200_000),
                "monthly-1000km", hasMonthlyMillionMeters(weeklyStats),
                "streak-7days", hasConsecutiveDays(activities, 7),
                "streak-30days", hasFourConsecutiveActiveWeeks(weeklyStats),
                "ftp-200", ftp >= 200,
                "ftp-250", ftp >= 250,
                "ftp-300", ftp >= 300,
                "elevation-1000m", hasWeeklyAverageElevation1000m(weeklyStats),
                "elevation-10000m", totalElevation >= 10_000
        );
    }

    private Map<LocalDate, WeekStats> computeWeeklyStats(List<Activity> activities) {
        return activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getStartedAt().toLocalDate().with(DayOfWeek.MONDAY),
                        Collectors.collectingAndThen(Collectors.toList(), list -> new WeekStats(
                                list.size(),
                                list.stream().mapToDouble(a -> toDouble(a.getDistanceM())).sum(),
                                list.stream().mapToDouble(a -> toDouble(a.getElevationGainM())).sum()
                        ))
                ));
    }

    private boolean hasMonthlyMillionMeters(Map<LocalDate, WeekStats> weeklyStats) {
        List<WeekStats> sorted = weeklyStats.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(Map.Entry::getValue)
                .toList();

        for (int i = 0; i <= sorted.size() - 4; i++) {
            double total = 0;
            for (int j = i; j < i + 4; j++) {
                total += sorted.get(j).totalDistanceM();
            }
            if (total >= 1_000_000) return true;
        }
        return false;
    }

    private boolean hasConsecutiveDays(List<Activity> activities, int count) {
        Set<LocalDate> activeDays = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .map(a -> a.getStartedAt().toLocalDate())
                .collect(Collectors.toSet());

        if (activeDays.size() < count) return false;

        List<LocalDate> sorted = new ArrayList<>(activeDays);
        sorted.sort(null);

        int streak = 1;
        for (int i = 1; i < sorted.size(); i++) {
            streak = sorted.get(i).equals(sorted.get(i - 1).plusDays(1)) ? streak + 1 : 1;
            if (streak >= count) return true;
        }
        return streak >= count;
    }

    private boolean hasFourConsecutiveActiveWeeks(Map<LocalDate, WeekStats> weeklyStats) {
        List<LocalDate> activeWeeks = weeklyStats.entrySet().stream()
                .filter(e -> e.getValue().activityCount() > 0)
                .map(Map.Entry::getKey)
                .sorted()
                .toList();

        if (activeWeeks.size() < 4) return false;

        int streak = 1;
        for (int i = 1; i < activeWeeks.size(); i++) {
            streak = activeWeeks.get(i).equals(activeWeeks.get(i - 1).plusWeeks(1)) ? streak + 1 : 1;
            if (streak >= 4) return true;
        }
        return streak >= 4;
    }

    private boolean hasWeeklyAverageElevation1000m(Map<LocalDate, WeekStats> weeklyStats) {
        return weeklyStats.values().stream()
                .filter(w -> w.activityCount() > 0)
                .anyMatch(w -> w.totalElevationM() / w.activityCount() >= 1000);
    }

    private int getFtp() {
        return profileRepository.findFirst()
                .map(p -> p.getFtpWatts() != null ? p.getFtpWatts().intValue() : 0)
                .orElse(0);
    }

    private Achievement mergeWithStored(Achievement def, Achievement stored) {
        if (stored == null || !stored.isUnlocked()) return def;
        return Achievement.builder()
                .id(def.getId())
                .name(def.getName())
                .description(def.getDescription())
                .icon(def.getIcon())
                .type(def.getType())
                .unlocked(true)
                .unlockedAt(stored.getUnlockedAt())
                .build();
    }

    private AchievementDto toDto(Achievement a) {
        return AchievementDto.builder()
                .id(a.getId())
                .name(a.getName())
                .description(a.getDescription())
                .icon(a.getIcon())
                .type(a.getType() != null ? a.getType().name() : null)
                .unlocked(a.isUnlocked())
                .unlockedAt(a.getUnlockedAt())
                .build();
    }

    private static double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : 0.0;
    }

    private static List<Achievement> buildDefinitions() {
        return List.of(
                Achievement.builder().id("weekly-100km").name("Setka w tygodniu")
                        .description("Przejechaj 100 km w jednym tygodniu").icon("🏅")
                        .type(AchievementType.DISTANCE).build(),
                Achievement.builder().id("weekly-200km").name("Dubeltówka")
                        .description("Przejechaj 200 km w jednym tygodniu").icon("🥇")
                        .type(AchievementType.DISTANCE).build(),
                Achievement.builder().id("monthly-1000km").name("Tysiąc w miesiącu")
                        .description("Przejechaj 1000 km w ciągu 4 tygodni").icon("🚀")
                        .type(AchievementType.DISTANCE).build(),
                Achievement.builder().id("streak-7days").name("Tygodniowy wojownik")
                        .description("7 kolejnych dni z aktywnością").icon("🔥")
                        .type(AchievementType.STREAK).build(),
                Achievement.builder().id("streak-30days").name("Mistrz regularności")
                        .description("4 kolejne tygodnie z aktywnością").icon("⚡")
                        .type(AchievementType.CONSISTENCY).build(),
                Achievement.builder().id("ftp-200").name("FTP 200 W")
                        .description("Osiągnij FTP na poziomie 200 W").icon("💪")
                        .type(AchievementType.FTP).build(),
                Achievement.builder().id("ftp-250").name("FTP 250 W")
                        .description("Osiągnij FTP na poziomie 250 W").icon("🏋️")
                        .type(AchievementType.FTP).build(),
                Achievement.builder().id("ftp-300").name("FTP 300 W")
                        .description("Osiągnij FTP na poziomie 300 W").icon("⚡")
                        .type(AchievementType.FTP).build(),
                Achievement.builder().id("elevation-1000m").name("Góral")
                        .description("Aktywność ze średnim przewyższeniem 1000 m").icon("⛰️")
                        .type(AchievementType.ELEVATION).build(),
                Achievement.builder().id("elevation-10000m").name("Zdobywca szczytów")
                        .description("Łączne przewyższenie 10 000 m").icon("🏔️")
                        .type(AchievementType.ELEVATION).build()
        );
    }

    private record WeekStats(int activityCount, double totalDistanceM, double totalElevationM) {
    }
}
