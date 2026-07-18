package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.vo.DateRange;

@Service
@RequiredArgsConstructor
public class HealthService {

    private final DailySummaryRepository dailySummaryRepository;

    public void updateHealthMetrics(Map<String, Object> body) {
        LocalDate today = LocalDate.now();
        DailySummary existing = dailySummaryRepository.findByDate(today).orElse(null);
        DailySummary.DailySummaryBuilder builder = existing != null
                ? existing.toBuilder()
                : DailySummary.builder().id(UUID.randomUUID()).date(today);

        if (body.containsKey("hrvRmssd")) builder.hrvRmssd(new BigDecimal(String.valueOf(body.get("hrvRmssd"))));
        if (body.containsKey("restingHrBpm")) builder.restingHrBpm(Short.valueOf(String.valueOf(body.get("restingHrBpm"))));
        if (body.containsKey("sleepScore")) builder.sleepScore(Short.valueOf(String.valueOf(body.get("sleepScore"))));
        if (body.containsKey("bodyBattery")) builder.bodyBattery(Short.valueOf(String.valueOf(body.get("bodyBattery"))));
        if (body.containsKey("stressAvg")) builder.stressAvg(Short.valueOf(String.valueOf(body.get("stressAvg"))));
        if (body.containsKey("sleepDurationSeconds")) builder.sleepDurationSeconds(Integer.valueOf(String.valueOf(body.get("sleepDurationSeconds"))));
        builder.healthMetricsUpdatedAt(Instant.now());
        dailySummaryRepository.save(builder.build());
    }

    public HealthOverview getOverview(LocalDate from, LocalDate to) {
        List<DailySummary> data = dailySummaryRepository.findByDateRange(DateRange.of(from, to));

        DailySummary latest = data.stream()
                .max(Comparator.comparing(DailySummary::getDate))
                .orElse(null);

        HrvTrend hrvTrend = calculateHrvTrend(data);
        SleepTrend sleepTrend = calculateSleepTrend(data);
        StressTrend stressTrend = calculateStressTrend(data);
        RestingHrTrend restingHrTrend = calculateRestingHrTrend(data);

        return new HealthOverview(latest, hrvTrend, sleepTrend, stressTrend, restingHrTrend);
    }

    public List<HealthDay> getHealthTimeline(LocalDate from, LocalDate to) {
        List<DailySummary> data = dailySummaryRepository.findByDateRange(DateRange.of(from, to));
        return data.stream()
                .sorted(Comparator.comparing(DailySummary::getDate))
                .map(this::toHealthDay)
                .toList();
    }

    public RecoveryStatus getRecoveryStatus(LocalDate date) {
        LocalDate from = date.minusDays(7);
        List<DailySummary> data = dailySummaryRepository.findByDateRange(DateRange.of(from, date));

        List<DailySummary> healthData = data.stream()
                .sorted(Comparator.comparing(DailySummary::getDate))
                .toList();

        if (healthData.isEmpty()) {
            return new RecoveryStatus(null, "UNKNOWN", "brak danych", "Brak danych zdrowotnych.", List.of());
        }

        DailySummary latest = healthData.getLast();
        int score = calculateRecoveryScore(healthData, latest);
        String level = recoveryLevel(score);
        String description = recoveryDescription(score, latest);
        List<String> alerts = detectAlerts(healthData, latest);

        String availability = healthData.size() >= 3 ? "AVAILABLE" : "PARTIAL";
        return new RecoveryStatus(score, availability, level, description, alerts);
    }

    // --- Trend calculations ---

    private HrvTrend calculateHrvTrend(List<DailySummary> data) {
        List<BigDecimal> values = data.stream()
                .filter(d -> d.getHrvRmssd() != null)
                .sorted(Comparator.comparing(DailySummary::getDate))
                .map(DailySummary::getHrvRmssd)
                .toList();

        if (values.isEmpty()) {
            return new HrvTrend(null, null, null, "brak danych");
        }

        BigDecimal current = values.getLast();
        BigDecimal avg = average(values);
        BigDecimal sevenDayAvg = average(
                values.size() > 7 ? values.subList(values.size() - 7, values.size()) : values);
        String direction = values.size() >= 3
                ? trendDirection(values.subList(Math.max(0, values.size() - 7), values.size()))
                : "stabilny";

        return new HrvTrend(current, avg, sevenDayAvg, direction);
    }

    private SleepTrend calculateSleepTrend(List<DailySummary> data) {
        List<Short> scores = data.stream()
                .filter(d -> d.getSleepScore() != null)
                .sorted(Comparator.comparing(DailySummary::getDate))
                .map(DailySummary::getSleepScore)
                .toList();

        List<Integer> durations = data.stream()
                .filter(d -> d.getSleepDurationSeconds() != null)
                .sorted(Comparator.comparing(DailySummary::getDate))
                .map(DailySummary::getSleepDurationSeconds)
                .toList();

        Short latestScore = scores.isEmpty() ? null : scores.getLast();
        BigDecimal avgScore = scores.isEmpty() ? null
                : BigDecimal.valueOf(scores.stream().mapToInt(Short::intValue).average().orElse(0))
                        .setScale(1, RoundingMode.HALF_UP);
        Integer avgDuration = durations.isEmpty() ? null
                : (int) durations.stream().mapToInt(Integer::intValue).average().orElse(0);

        return new SleepTrend(latestScore, avgScore, avgDuration);
    }

    private StressTrend calculateStressTrend(List<DailySummary> data) {
        List<Short> values = data.stream()
                .filter(d -> d.getStressAvg() != null)
                .sorted(Comparator.comparing(DailySummary::getDate))
                .map(DailySummary::getStressAvg)
                .toList();

        Short current = values.isEmpty() ? null : values.getLast();
        BigDecimal avg = values.isEmpty() ? null
                : BigDecimal.valueOf(values.stream().mapToInt(Short::intValue).average().orElse(0))
                        .setScale(1, RoundingMode.HALF_UP);

        return new StressTrend(current, avg);
    }

    private RestingHrTrend calculateRestingHrTrend(List<DailySummary> data) {
        List<Short> values = data.stream()
                .filter(d -> d.getRestingHrBpm() != null)
                .sorted(Comparator.comparing(DailySummary::getDate))
                .map(DailySummary::getRestingHrBpm)
                .toList();

        Short current = values.isEmpty() ? null : values.getLast();
        BigDecimal avg = values.isEmpty() ? null
                : BigDecimal.valueOf(values.stream().mapToInt(Short::intValue).average().orElse(0))
                        .setScale(1, RoundingMode.HALF_UP);
        String direction = values.size() >= 3
                ? trendDirection(values.stream().map(BigDecimal::valueOf).toList()
                        .subList(Math.max(0, values.size() - 7), values.size()))
                : "stabilny";

        return new RestingHrTrend(current, avg, direction);
    }

    // --- Recovery score ---

    private int calculateRecoveryScore(List<DailySummary> healthData, DailySummary latest) {
        int score = 50;

        if (latest.getHrvRmssd() != null) {
            List<BigDecimal> hrvValues = healthData.stream()
                    .filter(d -> d.getHrvRmssd() != null)
                    .map(DailySummary::getHrvRmssd)
                    .toList();
            if (!hrvValues.isEmpty()) {
                BigDecimal avg = average(hrvValues);
                double ratio = latest.getHrvRmssd().doubleValue() / avg.doubleValue();
                score += (int) Math.min(25, Math.max(-25, (ratio - 1.0) * 50));
            }
        }

        if (latest.getSleepScore() != null) {
            int sleepPts = latest.getSleepScore() >= 80 ? 15
                    : latest.getSleepScore() >= 60 ? 10
                    : latest.getSleepScore() >= 40 ? 5
                    : 0;
            score += sleepPts - 7;
        }

        if (latest.getStressAvg() != null) {
            int stressPts = latest.getStressAvg() <= 25 ? 10
                    : latest.getStressAvg() <= 40 ? 5
                    : latest.getStressAvg() <= 60 ? 0
                    : latest.getStressAvg() <= 75 ? -5
                    : -10;
            score += stressPts;
        }

        if (latest.getBodyBattery() != null) {
            int bbPts = latest.getBodyBattery() >= 75 ? 10
                    : latest.getBodyBattery() >= 50 ? 5
                    : latest.getBodyBattery() >= 25 ? 0
                    : -5;
            score += bbPts;
        }

        return Math.max(0, Math.min(100, score));
    }

    private String recoveryLevel(int score) {
        if (score >= 80) return "pełna regeneracja";
        if (score >= 60) return "dobra regeneracja";
        if (score >= 40) return "umiarkowane zmęczenie";
        if (score >= 20) return "duże zmęczenie";
        return "wyczerpanie";
    }

    private String recoveryDescription(int score, DailySummary latest) {
        StringBuilder sb = new StringBuilder();
        if (score >= 80) {
            sb.append("Organizm w pełni zregenerowany. ");
        } else if (score >= 60) {
            sb.append("Dobry poziom regeneracji. ");
        } else if (score >= 40) {
            sb.append("Umiarkowane zmęczenie — rozważ lżejszy trening. ");
        } else {
            sb.append("Wysoki poziom zmęczenia — zalecany odpoczynek. ");
        }

        if (latest.getHrvRmssd() != null) {
            sb.append(String.format("HRV: %.1f ms. ", latest.getHrvRmssd()));
        }
        if (latest.getSleepScore() != null) {
            sb.append(String.format("Sen: %d/100. ", latest.getSleepScore()));
        }

        return sb.toString().trim();
    }

    List<String> detectAlerts(List<DailySummary> data, DailySummary latest) {
        List<String> alerts = new ArrayList<>();

        List<BigDecimal> hrvValues = data.stream()
                .filter(d -> d.getHrvRmssd() != null)
                .sorted(Comparator.comparing(DailySummary::getDate))
                .map(DailySummary::getHrvRmssd)
                .toList();
        if (hrvValues.size() >= 3 && latest.getHrvRmssd() != null) {
            BigDecimal avg = average(hrvValues);
            if (latest.getHrvRmssd().compareTo(avg.multiply(BigDecimal.valueOf(0.8))) < 0) {
                alerts.add("HRV poniżej 80% średniej tygodniowej — możliwe przetrenowanie");
            }
        }

        if (latest.getStressAvg() != null && latest.getStressAvg() > 60) {
            alerts.add("Wysoki poziom stresu (" + latest.getStressAvg() + ") — rozważ relaksację");
        }

        if (latest.getSleepScore() != null && latest.getSleepScore() < 50) {
            alerts.add("Niska jakość snu (" + latest.getSleepScore() + "/100) — wpływa na regenerację");
        }

        if (latest.getBodyBattery() != null && latest.getBodyBattery() < 25) {
            alerts.add("Niski Body Battery (" + latest.getBodyBattery() + ") — organizm wymaga odpoczynku");
        }

        return alerts;
    }

    // --- Helpers ---

    private HealthDay toHealthDay(DailySummary d) {
        return new HealthDay(
                d.getDate(),
                d.getRestingHrBpm(),
                d.getHrvRmssd(),
                d.getSleepScore(),
                d.getSleepDurationSeconds(),
                d.getDeepSleepSeconds(),
                d.getLightSleepSeconds(),
                d.getRemSleepSeconds(),
                d.getAwakeSleepSeconds(),
                d.getBodyBattery(),
                d.getStressAvg(),
                d.getSteps(),
                d.getActiveCalories());
    }

    private BigDecimal average(List<BigDecimal> values) {
        return values.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private String trendDirection(List<BigDecimal> values) {
        if (values.size() < 3) return "stabilny";
        BigDecimal firstHalf = average(values.subList(0, values.size() / 2));
        BigDecimal secondHalf = average(values.subList(values.size() / 2, values.size()));
        double changePct = secondHalf.subtract(firstHalf).doubleValue() / firstHalf.doubleValue() * 100;
        if (changePct > 5) return "rosnący";
        if (changePct < -5) return "malejący";
        return "stabilny";
    }

    // --- Records ---

    public record HealthOverview(
            DailySummary latest,
            HrvTrend hrvTrend,
            SleepTrend sleepTrend,
            StressTrend stressTrend,
            RestingHrTrend restingHrTrend) {}

    public record HrvTrend(BigDecimal current, BigDecimal periodAvg, BigDecimal sevenDayAvg, String direction) {}

    public record SleepTrend(Short latestScore, BigDecimal avgScore, Integer avgDurationSeconds) {}

    public record StressTrend(Short current, BigDecimal avg) {}

    public record RestingHrTrend(Short current, BigDecimal avg, String direction) {}

    public record HealthDay(
            LocalDate date,
            Short restingHrBpm,
            BigDecimal hrvRmssd,
            Short sleepScore,
            Integer sleepDurationSeconds,
            Integer deepSleepSeconds,
            Integer lightSleepSeconds,
            Integer remSleepSeconds,
            Integer awakeSleepSeconds,
            Short bodyBattery,
            Short stressAvg,
            Integer steps,
            Integer activeCalories) {}

    public record RecoveryStatus(Integer score, String availability, String level, String description, List<String> alerts) {}
}
