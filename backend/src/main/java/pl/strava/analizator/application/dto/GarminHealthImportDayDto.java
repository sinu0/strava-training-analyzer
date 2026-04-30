package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record GarminHealthImportDayDto(
        LocalDate date,
        Short restingHrBpm,
        BigDecimal hrvRmssd,
        Short sleepScore,
        Short bodyBattery,
        Short stressAvg,
        Integer sleepDurationSeconds,
        Integer steps,
        Integer activeCalories,
        Integer deepSleepSeconds,
        Integer lightSleepSeconds,
        Integer remSleepSeconds,
        Integer awakeSleepSeconds,
        Instant syncedAt
) {
}
