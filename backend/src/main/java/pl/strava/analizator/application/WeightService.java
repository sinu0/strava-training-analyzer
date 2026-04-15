package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.AddWeightRequest;
import pl.strava.analizator.application.dto.SetWeightGoalRequest;
import pl.strava.analizator.application.dto.WeightGoalDto;
import pl.strava.analizator.application.dto.WeightOverviewDto;
import pl.strava.analizator.application.dto.WeightRecordDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.WeightGoal;
import pl.strava.analizator.domain.model.WeightRecord;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.WeightRepository;

@Service
@RequiredArgsConstructor
public class WeightService {

    private static final BigDecimal KCAL_PER_KG_FAT = new BigDecimal("7700");
    private static final BigDecimal SEVEN = new BigDecimal("7");

    private final WeightRepository weightRepository;
    private final AthleteProfileRepository profileRepository;
    private final ActivityRepository activityRepository;

    public WeightOverviewDto getOverview() {
        List<WeightRecord> history = weightRepository.findAllOrderByDate();
        BigDecimal currentWeight = weightRepository.findLatest()
                .map(WeightRecord::getWeightKg)
                .orElseGet(() -> profileRepository.findFirst()
                        .map(AthleteProfile::getWeightKg)
                        .orElse(null));

        WeightGoal goal = weightRepository.findActiveGoal().orElse(null);
        WeightGoalDto goalDto = goal != null ? toGoalDto(goal) : null;

        // Training calories last 7 days
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime sevenDaysAgo = now.minusDays(7);
        List<Activity> recentActivities = activityRepository.findByStartedAtBetween(sevenDaysAgo, now);
        int weeklyTrainingCaloriesInt = recentActivities.stream()
                .mapToInt(a -> a.getCalories() != null ? a.getCalories() : 0)
                .sum();
        BigDecimal weeklyTrainingCalories = BigDecimal.valueOf(weeklyTrainingCaloriesInt);

        BigDecimal dailyCaloricNeed = null;
        BigDecimal adjustedDailyTdee = null;
        BigDecimal dailyDeficit = null;
        BigDecimal weeksRemaining = null;
        BigDecimal recommendedDailyCalories = null;

        if (currentWeight != null) {
            // BMR only (no activity factor)
            double bmr = calculateBmr(currentWeight);
            // TDEE = BMR * 1.2 (sedentary base) + weekly training calories / 7
            double dailyFromTraining = weeklyTrainingCaloriesInt / 7.0;
            double tdee = bmr * 1.2 + dailyFromTraining;
            dailyCaloricNeed = BigDecimal.valueOf(tdee).setScale(0, RoundingMode.HALF_UP);
            adjustedDailyTdee = dailyCaloricNeed;

            if (goal != null) {
                long daysToGoal = ChronoUnit.DAYS.between(LocalDate.now(), goal.getTargetDate());
                if (daysToGoal > 0) {
                    weeksRemaining = BigDecimal.valueOf(daysToGoal).divide(SEVEN, 1, RoundingMode.HALF_UP);
                    BigDecimal weightDiff = currentWeight.subtract(goal.getTargetWeightKg());
                    BigDecimal totalKcalDiff = weightDiff.multiply(KCAL_PER_KG_FAT);
                    dailyDeficit = totalKcalDiff.divide(BigDecimal.valueOf(daysToGoal), 0, RoundingMode.HALF_UP);
                    recommendedDailyCalories = adjustedDailyTdee.subtract(dailyDeficit);
                }
            }
        }

        // Weekly weight change from last 2 measurements
        BigDecimal weeklyWeightChange = null;
        if (history.size() >= 2) {
            WeightRecord newest = history.get(history.size() - 1);
            WeightRecord prev = history.get(history.size() - 2);
            long daysBetween = ChronoUnit.DAYS.between(prev.getRecordedDate(), newest.getRecordedDate());
            if (daysBetween > 0) {
                BigDecimal diff = newest.getWeightKg().subtract(prev.getWeightKg());
                weeklyWeightChange = diff.multiply(SEVEN)
                        .divide(BigDecimal.valueOf(daysBetween), 2, RoundingMode.HALF_UP);
            }
        }

        // Data confidence
        String dataConfidence;
        if (history.size() >= 4) {
            dataConfidence = "wysoki";
        } else if (history.size() >= 2) {
            dataConfidence = "średni";
        } else {
            dataConfidence = "niski";
        }

        return WeightOverviewDto.builder()
                .currentWeightKg(currentWeight)
                .goal(goalDto)
                .dailyCaloricNeed(dailyCaloricNeed)
                .dailyDeficitOrSurplus(dailyDeficit)
                .weeksRemaining(weeksRemaining)
                .history(history.stream().map(this::toDto).toList())
                .weeklyTrainingCalories(weeklyTrainingCalories)
                .adjustedDailyTdee(adjustedDailyTdee)
                .recommendedDailyCalories(recommendedDailyCalories)
                .weeklyWeightChange(weeklyWeightChange)
                .dataConfidence(dataConfidence)
                .build();
    }

    public List<WeightRecordDto> getHistory(LocalDate from, LocalDate to) {
        List<WeightRecord> records;
        if (from != null && to != null) {
            records = weightRepository.findByDateRange(from, to);
        } else {
            records = weightRepository.findAllOrderByDate();
        }
        return records.stream().map(this::toDto).toList();
    }

    public WeightRecordDto addWeight(AddWeightRequest request) {
        // Upsert: if record for this date exists, update it
        WeightRecord existing = weightRepository.findByDate(request.getRecordedDate()).orElse(null);

        WeightRecord record = WeightRecord.builder()
                .id(existing != null ? existing.getId() : null)
                .weightKg(request.getWeightKg())
                .recordedDate(request.getRecordedDate())
                .notes(request.getNotes())
                .createdAt(existing != null ? existing.getCreatedAt() : Instant.now())
                .build();

        WeightRecord saved = weightRepository.save(record);

        // Also update athlete_profile.weight_kg to latest
        updateProfileWeight(saved.getWeightKg());

        return toDto(saved);
    }

    public void deleteWeight(UUID id) {
        weightRepository.deleteById(id);
    }

    public WeightGoalDto setGoal(SetWeightGoalRequest request) {
        // Replace any existing goal
        weightRepository.findActiveGoal().ifPresent(g -> weightRepository.deleteGoal(g.getId()));

        WeightGoal goal = WeightGoal.builder()
                .targetWeightKg(request.getTargetWeightKg())
                .targetDate(request.getTargetDate())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return toGoalDto(weightRepository.saveGoal(goal));
    }

    public void deleteGoal(UUID id) {
        weightRepository.deleteGoal(id);
    }

    private double calculateBmr(BigDecimal weightKg) {
        AthleteProfile profile = profileRepository.findFirst().orElse(null);
        int age = 30;
        if (profile != null && profile.getDateOfBirth() != null) {
            age = (int) ChronoUnit.YEARS.between(profile.getDateOfBirth(), LocalDate.now());
        }
        int heightCm = 178;
        return 10.0 * weightKg.doubleValue() + 6.25 * heightCm - 5.0 * age + 5;
    }

    private void updateProfileWeight(BigDecimal weightKg) {
        profileRepository.findFirst().ifPresent(profile -> {
            AthleteProfile updated = AthleteProfile.builder()
                    .id(profile.getId())
                    .name(profile.getName())
                    .email(profile.getEmail())
                    .ftpWatts(profile.getFtpWatts())
                    .lthrBpm(profile.getLthrBpm())
                    .maxHrBpm(profile.getMaxHrBpm())
                    .restingHrBpm(profile.getRestingHrBpm())
                    .weightKg(weightKg)
                    .dateOfBirth(profile.getDateOfBirth())
                    .stravaAthleteId(profile.getStravaAthleteId())
                    .stravaAccessToken(profile.getStravaAccessToken())
                    .stravaRefreshToken(profile.getStravaRefreshToken())
                    .stravaTokenExpires(profile.getStravaTokenExpires())
                    .garminUserId(profile.getGarminUserId())
                    .garminToken(profile.getGarminToken())
                    .createdAt(profile.getCreatedAt())
                    .updatedAt(Instant.now())
                    .build();
            profileRepository.save(updated);
        });
    }

    private WeightRecordDto toDto(WeightRecord record) {
        return WeightRecordDto.builder()
                .id(record.getId())
                .weightKg(record.getWeightKg())
                .recordedDate(record.getRecordedDate())
                .notes(record.getNotes())
                .createdAt(record.getCreatedAt())
                .build();
    }

    private WeightGoalDto toGoalDto(WeightGoal goal) {
        return WeightGoalDto.builder()
                .id(goal.getId())
                .targetWeightKg(goal.getTargetWeightKg())
                .targetDate(goal.getTargetDate())
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }
}
