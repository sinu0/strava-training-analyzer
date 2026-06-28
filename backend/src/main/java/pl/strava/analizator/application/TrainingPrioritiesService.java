package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import pl.strava.analizator.application.dto.CpModelDto;
import pl.strava.analizator.application.dto.DurabilityProfileDto;
import pl.strava.analizator.application.dto.FatigueFactorsDto;
import pl.strava.analizator.application.dto.IntervalDetectionDto;
import pl.strava.analizator.application.dto.IntervalSessionDto;
import pl.strava.analizator.application.dto.PowerPhenotypeDto;
import pl.strava.analizator.application.dto.TrainingPrioritiesDto;
import pl.strava.analizator.application.dto.TrainingPriorityDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.vo.DateRange;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrainingPrioritiesService {

    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository activityMetricRepository;
    private final DailyMetricRepository dailyMetricRepository;
    private final AthleteProfileRepository athleteProfileRepository;

    private static final String POWER_CURVE_METRIC = "power_curve";
    private static final String TSS_METRIC = "training_stress_score";
    private static final String AEROBIC_DECOUPLING_METRIC = "aerobic_decoupling";
    private static final String POWER_FADE_METRIC = "power_fade";

    // Coggan reference W/kg values per duration (world-class)
    private static final Map<Integer, Double> REFERENCE_WKG = Map.of(
            5, 24.0, 30, 11.5, 60, 8.4, 300, 6.0,
            1200, 4.6, 1800, 4.2, 3600, 3.7, 7200, 3.1
    );

    // Duration labels for display
    private static final Map<Integer, String> DURATION_LABELS = Map.of(
            5, "5s", 30, "30s", 60, "1min", 300, "5min",
            1200, "20min", 1800, "30min", 3600, "60min", 7200, "120min"
    );

    public TrainingPrioritiesDto getPriorities() {
        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);
        if (profile == null || !profile.hasFtp()) {
            return TrainingPrioritiesDto.builder()
                    .priorities(List.of(TrainingPriorityDto.builder()
                            .rank(1).title("Skonfiguruj FTP")
                            .subsystem("setup").weeklyHours(0).impactScore(100)
                            .rationale("Brak ustawionego FTP — wszystkie metryki wymagają tej wartości.")
                            .action("Ustaw swoje FTP w profilu lub wykonaj test 20-minutowy.")
                            .metricsSummary("Brak danych").build()))
                    .build();
        }

        double ftp = profile.getFtpWatts() != null ? profile.getFtpWatts() : 200;
        double weight = profile.getWeightKg() != null ? profile.getWeightKg().doubleValue() : 75;

        // Fetch data
        OffsetDateTime ninetyDaysAgo = OffsetDateTime.now(ZoneOffset.UTC).minusDays(90);
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<Activity> allActivities = activityRepository.findByStartedAtBetween(ninetyDaysAgo, now);
        List<Activity> poweredActivities = allActivities.stream()
                .filter(Activity::hasPowerData)
                .toList();
        List<Activity> longRides = poweredActivities.stream()
                .filter(a -> a.getMovingTimeSec() != null && a.getMovingTimeSec() >= 45 * 60)
                .sorted(Comparator.comparing(Activity::getStartedAt).reversed())
                .toList();

        // Compute models
        CpModelDto cpModel = computeCpModel(poweredActivities, ftp, weight);
        IntervalDetectionDto intervalDetection = detectIntervals(poweredActivities, ftp);
        FatigueFactorsDto fatigue = computeFatigue(allActivities, profile);
        DurabilityProfileDto durability = computeDurability(longRides);
        PowerPhenotypeDto phenotype = computePhenotype(poweredActivities, ftp, weight);

        // Rank priorities
        List<TrainingPriorityDto> priorities = rankPriorities(
                cpModel, intervalDetection, fatigue, durability, phenotype, ftp);

        return TrainingPrioritiesDto.builder()
                .cpModel(cpModel)
                .intervalDetection(intervalDetection)
                .fatigueFactors(fatigue)
                .durabilityProfile(durability)
                .powerPhenotype(phenotype)
                .priorities(priorities)
                .build();
    }

    // ==================== CP/W' Model ====================

    private CpModelDto computeCpModel(List<Activity> poweredActivities, double ftp, double weight) {
        Map<Integer, Double> bestEfforts = aggregatePowerCurve(poweredActivities);

        List<double[]> points = new ArrayList<>();
        int[] durations = {120, 180, 300, 600, 900, 1200, 1800};
        for (int t : durations) {
            Double watts = bestEfforts.get(t);
            if (watts != null && watts > 0) {
                points.add(new double[]{(double) t, watts * t});
            }
        }

        if (points.size() < 2) {
            return CpModelDto.builder()
                    .cp(ftp * 0.76).wPrime(15000).rSquared(0)
                    .cpPerKg(ftp * 0.76 / weight).dataPoints(0).cpConfidence(0)
                    .currentFtp(ftp).ftpVsCpPct(100).build();
        }

        int n = points.size();
        double sumT = 0, sumE = 0, sumT2 = 0, sumTE = 0;
        for (double[] p : points) {
            sumT += p[0]; sumE += p[1]; sumT2 += p[0] * p[0]; sumTE += p[0] * p[1];
        }
        double denom = n * sumT2 - sumT * sumT;
        double cp = denom > 1e-9 ? (n * sumTE - sumT * sumE) / denom : ftp * 0.76;
        double wPrime = denom > 1e-9 ? (sumE * sumT2 - sumT * sumTE) / denom : 15000;
        cp = Math.max(0, cp);
        wPrime = Math.max(0, wPrime);

        double meanE = sumE / n;
        double ssRes = 0, ssTot = 0;
        for (double[] p : points) {
            double predicted = cp * p[0] + wPrime;
            ssRes += (p[1] - predicted) * (p[1] - predicted);
            ssTot += (p[1] - meanE) * (p[1] - meanE);
        }
        double rSquared = ssTot > 1e-9 ? 1 - ssRes / ssTot : 0;

        int confidence = points.size() >= 4 ? 90 :
                points.size() >= 3 ? 70 : 50;
        double cpPerKg = cp / weight;
        double ftpVsCpPct = cp > 0 ? (ftp / cp) * 100 : 100;

        return CpModelDto.builder()
                .cp(cp).wPrime(wPrime).rSquared(rSquared).cpPerKg(cpPerKg)
                .dataPoints(points.size()).cpConfidence(confidence)
                .currentFtp(ftp).ftpVsCpPct(ftpVsCpPct).build();
    }

    private Map<Integer, Double> aggregatePowerCurve(List<Activity> activities) {
        Map<Integer, Double> best = new TreeMap<>();
        for (Activity a : activities) {
            List<MetricResult> metrics = activityMetricRepository.findAllByActivityId(a.getId());
            for (MetricResult m : metrics) {
                if (POWER_CURVE_METRIC.equals(m.getMetricName()) && m.getJsonValue() != null) {
                    Object effortsObj = m.getJsonValue().get("efforts");
                    if (effortsObj instanceof Map<?, ?> effortsMap) {
                        for (Map.Entry<?, ?> e : effortsMap.entrySet()) {
                            int dur = Integer.parseInt(String.valueOf(e.getKey()));
                            double watts = Double.parseDouble(String.valueOf(e.getValue()));
                            best.merge(dur, watts, (cur, cand) -> Math.max(cur, cand));
                        }
                    }
                }
            }
        }
        return best;
    }

    // ==================== Interval Detection ====================

    private IntervalDetectionDto detectIntervals(List<Activity> poweredActivities, double ftp) {
        List<IntervalSessionDto> sessions = new ArrayList<>();
        Map<String, Integer> byType = new HashMap<>();

        for (Activity a : poweredActivities) {
            int[] power = a.getPowerStream();
            if (power == null || power.length < 120) continue;

            List<SustainedEffortBlock> blocks = findSustainedEfforts(power, ftp);
            if (blocks.isEmpty()) continue;

            String type = classifyIntervalType(blocks, ftp);
            int intervalCount = blocks.size();
            int avgDuration = (int) blocks.stream().mapToInt(b -> b.durationSec).average().orElse(0);
            double avgPowerPct = blocks.stream().mapToDouble(b -> b.avgPowerPctOfFtp).average().orElse(0);
            int totalWorkSec = blocks.stream().mapToInt(b -> b.durationSec).sum();

            double avgRestDuration = 0;
            int restCount = 0;
            for (int i = 0; i < blocks.size() - 1; i++) {
                int gapStart = blocks.get(i).endIdx;
                int gapEnd = blocks.get(i + 1).startIdx;
                if (gapEnd > gapStart) {
                    avgRestDuration += (gapEnd - gapStart);
                    restCount++;
                }
            }
            double restRatio = (avgRestDuration > 0 && restCount > 0)
                    ? (double) totalWorkSec / restCount / (avgRestDuration / restCount) : 1.0;

            int qualityScore = calculateIntervalQuality(type, blocks, ftp, restRatio);

            byType.merge(type, 1, Integer::sum);

            sessions.add(IntervalSessionDto.builder()
                    .date(a.getStartedAt() != null ? a.getStartedAt().toLocalDate().toString() : "?")
                    .activityId(a.getId().toString())
                    .intervalType(type).intervalCount(intervalCount)
                    .avgDurationSec(avgDuration).avgPowerPct(avgPowerPct)
                    .totalWorkSec(totalWorkSec).restRatio(restRatio)
                    .qualityScore(qualityScore).build());
        }

        sessions.sort(Comparator.comparing(IntervalSessionDto::getDate).reversed());
        List<IntervalSessionDto> recent = sessions.size() > 5 ? sessions.subList(0, 5) : sessions;

        double avgQuality = recent.stream().mapToInt(IntervalSessionDto::getQualityScore).average().orElse(0);
        String trend = avgQuality >= 75 ? "DOBRA_STRUKTURA" :
                sessions.size() >= 3 ? "NIEREGULARNE" : sessionTrend(recent);
        String recommendation = generateIntervalRecommendation(byType, avgQuality, sessions.size());

        return IntervalDetectionDto.builder()
                .totalIntervalSessions(sessions.size())
                .sessionsByType(byType)
                .recentSessions(recent)
                .avgQualityScore(avgQuality)
                .trend(trend)
                .recommendation(recommendation)
                .build();
    }

    private String sessionTrend(List<IntervalSessionDto> sessions) {
        if (sessions.size() < 3) return "MAŁO_DANYCH";
        long improving = 0;
        for (int i = 0; i < sessions.size() - 1; i++) {
            if (sessions.get(i).getQualityScore() > sessions.get(i + 1).getQualityScore()) improving++;
        }
        return improving >= sessions.size() / 2 ? "POPRAWA" : "SPADEK";
    }

    private String generateIntervalRecommendation(Map<String, Integer> byType, double avgQuality, int total) {
        if (total == 0) return "Brak wykrytych interwałów — dodaj 1-2 sesje z celem tygodniowo.";
        String dominating = byType.entrySet().stream()
                .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("");
        if ("THRESHOLD".equals(dominating))
            return "Dominują interwały progowe — rozważ dodanie VO₂max (3-5 min) dla zrównoważonego rozwoju.";
        if ("VO2MAX".equals(dominating))
            return "Dużo interwałów VO₂max — pamiętaj o regeneracji i bazie tlenowej.";
        if ("ANAEROBIC".equals(dominating))
            return "Wiele interwałów anaerobowych — uzupełnij dłuższymi interwałami progowymi.";
        if (avgQuality < 50)
            return "Jakość interwałów niska — skup się na równej mocy i kontrolowanym odpoczynku.";
        return "Dobra struktura interwałów — kontynuuj progresję.";
    }

    private List<SustainedEffortBlock> findSustainedEfforts(int[] power, double ftp) {
        List<SustainedEffortBlock> blocks = new ArrayList<>();
        int minBlockSec = 30;
        double thresholdPct = 0.85;

        int i = 0;
        while (i < power.length) {
            if (power[i] >= ftp * thresholdPct) {
                int start = i;
                double sum = 0;
                while (i < power.length && power[i] >= ftp * 0.7) {
                    sum += power[i];
                    i++;
                }
                int duration = i - start;
                if (duration >= minBlockSec && sum / duration >= ftp * thresholdPct) {
                    double avgPower = sum / duration;
                    blocks.add(new SustainedEffortBlock(start, i, duration, avgPower / ftp * 100));
                }
            } else {
                i++;
            }
        }
        return mergeCloseBlocks(blocks);
    }

    private List<SustainedEffortBlock> mergeCloseBlocks(List<SustainedEffortBlock> blocks) {
        if (blocks.size() < 2) return blocks;
        List<SustainedEffortBlock> merged = new ArrayList<>();
        merged.add(blocks.get(0));
        for (int i = 1; i < blocks.size(); i++) {
            SustainedEffortBlock prev = merged.get(merged.size() - 1);
            SustainedEffortBlock cur = blocks.get(i);
            if (cur.startIdx - prev.endIdx <= 15 && cur.avgPowerPctOfFtp >= 85 && prev.avgPowerPctOfFtp >= 85) {
                int totalDuration = prev.durationSec + cur.durationSec + (cur.startIdx - prev.endIdx);
                double totalAvg = (prev.avgPowerPctOfFtp * prev.durationSec + cur.avgPowerPctOfFtp * cur.durationSec) / (prev.durationSec + cur.durationSec);
                merged.set(merged.size() - 1,
                        new SustainedEffortBlock(prev.startIdx, cur.endIdx, totalDuration, totalAvg));
            } else {
                merged.add(cur);
            }
        }
        return merged;
    }

    private String classifyIntervalType(List<SustainedEffortBlock> blocks, double ftp) {
        double avgDur = blocks.stream().mapToInt(b -> b.durationSec).average().orElse(0);
        double avgPct = blocks.stream().mapToDouble(b -> b.avgPowerPctOfFtp).average().orElse(100);

        if (avgDur < 30 && avgPct >= 150) return "NEUROMUSCULAR";
        if (avgDur < 120 && avgPct >= 105) return "ANAEROBIC";
        if (avgDur < 480 && avgPct >= 100) return "VO2MAX";
        if (avgDur >= 480 && avgPct >= 88) return "THRESHOLD";
        return "ENDURANCE";
    }

    private int calculateIntervalQuality(String type, List<SustainedEffortBlock> blocks, double ftp, double restRatio) {
        double targetPct = switch (type) {
            case "THRESHOLD" -> 95; case "VO2MAX" -> 108;
            case "ANAEROBIC" -> 120; case "NEUROMUSCULAR" -> 160;
            default -> 90;
        };
        double powerScore = Math.min(100, blocks.stream()
                .mapToDouble(b -> Math.min(100, (b.avgPowerPctOfFtp / targetPct) * 100))
                .average().orElse(0));
        double consistency = calculateConsistency(blocks);
        double restScore = type.equals("THRESHOLD") ? Math.min(100, Math.max(0, restRatio * 50))
                : type.equals("VO2MAX") ? Math.min(100, Math.max(0, (1.0 / Math.max(0.3, restRatio)) * 50))
                : 70;
        return (int) Math.round(powerScore * 0.4 + consistency * 0.3 + restScore * 0.3);
    }

    private double calculateConsistency(List<SustainedEffortBlock> blocks) {
        if (blocks.size() < 2) return 70;
        double meanPct = blocks.stream().mapToDouble(b -> b.avgPowerPctOfFtp).average().orElse(0);
        double variance = blocks.stream()
                .mapToDouble(b -> Math.pow(b.avgPowerPctOfFtp - meanPct, 2))
                .average().orElse(0);
        double cv = Math.sqrt(variance) / meanPct;
        return Math.max(0, 100 - cv * 100);
    }

    private record SustainedEffortBlock(int startIdx, int endIdx, int durationSec, double avgPowerPctOfFtp) {}

    // ==================== Multi-factor Fatigue ====================

    private FatigueFactorsDto computeFatigue(List<Activity> activities, AthleteProfile profile) {
        // ATL fatigue from PMC
        double atl = 50, ctl = 50;
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        DateRange lastWeek = new DateRange(today.minusDays(7), today);
        DateRange lastSixWeeks = new DateRange(today.minusDays(42), today);

        Map<LocalDate, BigDecimal> tssSeries = dailyMetricRepository.findNumericSeries("tss", lastSixWeeks);
        Map<LocalDate, BigDecimal> ctlSeries = dailyMetricRepository.findNumericSeries("ctl", lastWeek);
        Map<LocalDate, BigDecimal> atlSeries = dailyMetricRepository.findNumericSeries("atl", lastWeek);

        if (!atlSeries.isEmpty()) atl = atlSeries.values().stream()
                .mapToDouble(BigDecimal::doubleValue).average().orElse(50);
        if (!ctlSeries.isEmpty()) ctl = ctlSeries.values().stream()
                .mapToDouble(BigDecimal::doubleValue).average().orElse(50);

        double atlFatigue = Math.min(100, Math.max(0, (atl - ctl) * 2.0 + 25));

        // Muscular: power fade from recent rides
        double avgPowerFade = computeAvgPowerFade(activities);
        double muscularFatigue = Math.min(100, avgPowerFade * 6.0 + atlFatigue * 0.3);

        // Metabolic: recent TSS accumulation
        double weeklyTss = tssSeries.values().stream()
                .mapToDouble(BigDecimal::doubleValue).sum() / 6.0;
        double metabolicFatigue = Math.min(100, (weeklyTss / 500.0) * 70 + atlFatigue * 0.2);

        // ANS: check for HRV drift / resting HR trend
        Map<LocalDate, BigDecimal> restingHrSeries = dailyMetricRepository.findNumericSeries("resting_hr", lastSixWeeks);
        double ansFatigue = 30;
        if (restingHrSeries.size() >= 5) {
            List<Map.Entry<LocalDate, BigDecimal>> sorted = restingHrSeries.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey()).toList();
            double first = sorted.getFirst().getValue().doubleValue();
            double last = sorted.getLast().getValue().doubleValue();
            double trend = (last - first) / first;
            ansFatigue = Math.min(100, 50 + trend * 500);
        }

        int compositeScore = (int) Math.round(atlFatigue * 0.3 + muscularFatigue * 0.25
                + metabolicFatigue * 0.25 + ansFatigue * 0.2);
        String statusLabel;
        String description;
        if (compositeScore >= 70) {
            statusLabel = "Wysokie zmęczenie";
            description = "Potrzebujesz regeneracji. Wszystkie systemy sygnalizują przeciążenie.";
        } else if (compositeScore >= 45) {
            statusLabel = "Umiarkowane zmęczenie";
            description = String.format("Produktywne zmęczenie. Głównie od: %s.",
                    atlFatigue > muscularFatigue && atlFatigue > metabolicFatigue ? "obciążenia treningowego" :
                    muscularFatigue > metabolicFatigue ? "zmęczenia mięśniowego" : "obciążenia metabolicznego");
        } else {
            statusLabel = "Niskie zmęczenie";
            description = "Świeży — dobry moment na jakościowy trening.";
        }

        return FatigueFactorsDto.builder()
                .atlFatigue(atlFatigue).muscularFatigue(muscularFatigue)
                .metabolicFatigue(metabolicFatigue).ansFatigue(ansFatigue)
                .compositeScore(compositeScore).statusLabel(statusLabel).description(description)
                .build();
    }

    private double computeAvgPowerFade(List<Activity> activities) {
        return activities.stream()
                .filter(a -> a.getMovingTimeSec() != null && a.getMovingTimeSec() >= 30 * 60)
                .map(a -> activityMetricRepository.findNumericValue(a.getId(), POWER_FADE_METRIC))
                .filter(java.util.Optional::isPresent)
                .mapToDouble(v -> v.get().doubleValue())
                .average().orElse(0);
    }

    // ==================== Extended Durability ====================

    private DurabilityProfileDto computeDurability(List<Activity> longRides) {
        if (longRides.isEmpty()) {
            return DurabilityProfileDto.builder()
                    .overallScore(0).trend("NO_DATA").label("Brak danych")
                    .description("Potrzeba kilku dłuższych jazd z mocą i tętnem, żeby ocenić odporność na zmęczenie.")
                    .shortDurationResistance(0).mediumDurationResistance(0).longDurationResistance(0)
                    .avgAerobicDecoupling(0).avgPowerFade(0).fatigueResistanceIndex(0)
                    .recentWorkoutsCount(0)
                    .recommendation("Wykonaj 2-3 jazdy po 60-120 min z pomiarem mocy i tętna.").build();
        }

        List<UUID> ids = longRides.stream().map(Activity::getId).toList();
        Map<UUID, BigDecimal> decouplingMap = activityMetricRepository.findNumericValues(ids, AEROBIC_DECOUPLING_METRIC);
        Map<UUID, BigDecimal> powerFadeMap = activityMetricRepository.findNumericValues(ids, POWER_FADE_METRIC);

        double avgDecoupling = decouplingMap.values().stream()
                .mapToDouble(BigDecimal::doubleValue).average().orElse(0);
        double avgPowerFade = powerFadeMap.values().stream()
                .mapToDouble(BigDecimal::doubleValue).average().orElse(0);

        int shortResistance = scoreResistance(avgDecoupling, avgPowerFade);
        int mediumResistance = scoreResistance(
                longRides.stream().filter(a -> a.getMovingTimeSec() >= 60 * 60)
                        .map(a -> decouplingMap.get(a.getId())).filter(v -> v != null)
                        .mapToDouble(BigDecimal::doubleValue).average().orElse(avgDecoupling),
                longRides.stream().filter(a -> a.getMovingTimeSec() >= 60 * 60)
                        .map(a -> powerFadeMap.get(a.getId())).filter(v -> v != null)
                        .mapToDouble(BigDecimal::doubleValue).average().orElse(avgPowerFade));
        int longResistance = scoreResistance(
                longRides.stream().filter(a -> a.getMovingTimeSec() >= 90 * 60)
                        .map(a -> decouplingMap.get(a.getId())).filter(v -> v != null)
                        .mapToDouble(BigDecimal::doubleValue).average().orElse(avgDecoupling),
                longRides.stream().filter(a -> a.getMovingTimeSec() >= 90 * 60)
                        .map(a -> powerFadeMap.get(a.getId())).filter(v -> v != null)
                        .mapToDouble(BigDecimal::doubleValue).average().orElse(avgPowerFade));

        // FRI: ratio of 60-min best to 20-min best (higher = better endurance)
        double fri = computeFri(longRides);

        int overallScore = (int) Math.round(
                shortResistance * 0.3 + mediumResistance * 0.4 + longResistance * 0.3);
        String trend = overallScore >= 70 ? "DOBRA" : overallScore >= 40 ? "ŚREDNIA" : "DO_POPRAWY";
        String label = trend.equals("DOBRA") ? "Wysoka odporność" :
                trend.equals("ŚREDNIA") ? "Umiarkowana odporność" : "Niska odporność";
        String description = buildDurabilityDescription(avgDecoupling, avgPowerFade, fri);
        String recommendation = buildDurabilityRecommendation(overallScore, shortResistance, mediumResistance, longResistance);

        return DurabilityProfileDto.builder()
                .overallScore(overallScore).trend(trend).label(label).description(description)
                .shortDurationResistance(shortResistance).mediumDurationResistance(mediumResistance)
                .longDurationResistance(longResistance)
                .avgAerobicDecoupling(avgDecoupling).avgPowerFade(avgPowerFade)
                .fatigueResistanceIndex(fri).recentWorkoutsCount(longRides.size())
                .recommendation(recommendation).build();
    }

    private int scoreResistance(double decoupling, double powerFade) {
        double penalty = Math.max(0, decoupling) * 5 + Math.max(0, powerFade) * 4;
        return (int) Math.round(Math.max(0, 100 - penalty));
    }

    private double computeFri(List<Activity> longRides) {
        Map<Integer, Double> best = aggregatePowerCurve(longRides);
        Double p20 = best.get(1200);
        Double p60 = best.get(3600);
        if (p20 != null && p20 > 0 && p60 != null && p60 > 0) {
            return p60 / p20;
        }
        return 0.85; // default assumption
    }

    private String buildDurabilityDescription(double decoupling, double powerFade, double fri) {
        if (decoupling < 3 && powerFade < 5 && fri > 0.9)
            return "Doskonała odporność na zmęczenie — moc i tętno pozostają stabilne nawet na długich jazdach.";
        if (decoupling < 5 && powerFade < 8)
            return "Przyzwoita odporność — przy dłuższych wysiłkach widać niewielki spadek mocy lub dryft tętna.";
        if (decoupling >= 5 || powerFade >= 8)
            return "Niska odporność na zmęczenie — moc wyraźnie spada, a tętno rośnie w drugiej połowie długich jazd.";
        return "Za mało danych do pełnej oceny.";
    }

    private String buildDurabilityRecommendation(int overall, int shortR, int mediumR, int longR) {
        if (overall >= 70) return "Kontynuuj obecne obciążenie — dodaj progresję na długich wytrzymałościach.";
        if (longR < 40) return "Priorytet: długie wytrzymałości 90-180 min w Z2 — buduj bazę tlenową.";
        if (mediumR < 40) return "Dodaj tempo/SST 60-90 min — naucz organizm utrzymywać moc przy zmęczeniu.";
        if (shortR < 40) return "Sesje 45-60 min z progresją mocy — popraw zdolność utrzymania intensywności.";
        return "Zwiększ częstotliwość długich jazd (2-3/tydz.) z pomiarem mocy i tętna.";
    }

    // ==================== Power Phenotype ====================

    private PowerPhenotypeDto computePhenotype(List<Activity> poweredActivities, double ftp, double weight) {
        Map<Integer, Double> bestEfforts = aggregatePowerCurve(poweredActivities);

        Map<String, Double> profileWkg = new LinkedHashMap<>();
        Map<String, Integer> percentiles = new LinkedHashMap<>();
        Map<String, Double> gapByLabel = new LinkedHashMap<>();

        for (Map.Entry<Integer, String> entry : DURATION_LABELS.entrySet()) {
            int dur = entry.getKey();
            String label = entry.getValue();
            Double watts = bestEfforts.get(dur);
            double wkg = (watts != null && watts > 0) ? watts / weight : 0;
            profileWkg.put(label, wkg);

            Double ref = REFERENCE_WKG.get(dur);
            int pct = (ref != null && ref > 0) ? (int) Math.min(100, (wkg / ref) * 100) : 0;
            percentiles.put(label, pct);
            if (ref != null && ref > 0) {
                gapByLabel.put(label, Math.max(0, ref - wkg));
            }
        }

        String bestLabel = percentiles.entrySet().stream()
                .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("?");
        String worstLabel = percentiles.entrySet().stream()
                .min(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("?");
        double weaknessGap = gapByLabel.getOrDefault(worstLabel, 0.0);

        String primaryType = classifyPhenotype(profileWkg);
        String secondaryType = findSecondary(percentiles, primaryType);

        String description = buildPhenotypeDescription(primaryType, bestLabel, worstLabel);
        String recommendation = buildPhenotypeRecommendation(primaryType, worstLabel, weaknessGap);

        return PowerPhenotypeDto.builder()
                .primaryType(primaryType).secondaryType(secondaryType)
                .powerProfileWkg(profileWkg).percentiles(percentiles)
                .bestDuration(bestLabel).worstDuration(worstLabel)
                .weaknessGapWkg(weaknessGap).description(description)
                .recommendation(recommendation).build();
    }

    private String classifyPhenotype(Map<String, Double> profile) {
        Map<String, Double> scores = new HashMap<>();
        scores.put("SPRINTER", sprintScore(profile));
        scores.put("PURSUITER", pursuiterScore(profile));
        scores.put("TIME_TRIALIST", ttScore(profile));
        scores.put("ALL_ROUNDER", allRounderScore(profile));
        scores.put("CLIMBER", climberScore(profile, 75)); // default weight assumption

        return scores.entrySet().stream()
                .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse("ALL_ROUNDER");
    }

    private double sprintScore(Map<String, Double> p) {
        return (p.getOrDefault("5s", 0.0) / REFERENCE_WKG.get(5)) * 40
                + (p.getOrDefault("30s", 0.0) / REFERENCE_WKG.get(30)) * 30
                + (p.getOrDefault("1min", 0.0) / REFERENCE_WKG.get(60)) * 20
                + (p.getOrDefault("5min", 0.0) / REFERENCE_WKG.get(300)) * 10;
    }

    private double pursuiterScore(Map<String, Double> p) {
        return (p.getOrDefault("30s", 0.0) / REFERENCE_WKG.get(30)) * 20
                + (p.getOrDefault("1min", 0.0) / REFERENCE_WKG.get(60)) * 30
                + (p.getOrDefault("5min", 0.0) / REFERENCE_WKG.get(300)) * 30
                + (p.getOrDefault("20min", 0.0) / REFERENCE_WKG.get(1200)) * 20;
    }

    private double ttScore(Map<String, Double> p) {
        return (p.getOrDefault("5min", 0.0) / REFERENCE_WKG.get(300)) * 20
                + (p.getOrDefault("20min", 0.0) / REFERENCE_WKG.get(1200)) * 35
                + (p.getOrDefault("60min", 0.0) / REFERENCE_WKG.get(3600)) * 35
                + (p.getOrDefault("120min", 0.0) / REFERENCE_WKG.get(7200)) * 10;
    }

    private double allRounderScore(Map<String, Double> p) {
        double sum = 0;
        for (Map.Entry<Integer, Double> ref : REFERENCE_WKG.entrySet()) {
            String label = DURATION_LABELS.get(ref.getKey());
            if (label != null) {
                sum += Math.min(1.0, p.getOrDefault(label, 0.0) / ref.getValue());
            }
        }
        return sum / REFERENCE_WKG.size();
    }

    private double climberScore(Map<String, Double> p, double weight) {
        double wkg5min = p.getOrDefault("5min", 0.0);
        double wkg20min = p.getOrDefault("20min", 0.0);
        double wkg60min = p.getOrDefault("60min", 0.0);
        return (wkg5min / 6.0) * 30 + (wkg20min / 4.6) * 40 + (wkg60min / 3.7) * 30;
    }

    private String findSecondary(Map<String, Integer> percentiles, String primary) {
        return percentiles.entrySet().stream()
                .filter(e -> !e.getKey().equals(primary))
                .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
    }

    private String buildPhenotypeDescription(String type, String best, String worst) {
        return switch (type) {
            case "SPRINTER" -> String.format("Dominuje moc maksymalna — najmocniejszy w %s, najsłabszy w %s.", best, worst);
            case "PURSUITER" -> String.format("Profil pościgowca — dobry balans mocy anaerobowej i tlenowej. Mocna strona: %s.", best);
            case "TIME_TRIALIST" -> String.format("Profil czasowca — doskonała wytrzymałość progowa. Najmocniejszy w %s, do poprawy: %s.", best, worst);
            case "CLIMBER" -> String.format("Profil górala — wysoka moc względna (W/kg). Najmocniejszy: %s.", best);
            default -> String.format("Wszechstronny — zrównoważony profil mocy. Najmocniejszy w %s, do poprawy: %s.", best, worst);
        };
    }

    private String buildPhenotypeRecommendation(String type, String worst, double gap) {
        if (gap < 0.5) return "Profil zrównoważony — kontynuuj wszechstronny trening.";
        return switch (type) {
            case "SPRINTER" -> String.format("Pracuj nad %s — dodaj interwały progowe i tempo.", worst);
            case "PURSUITER" -> String.format("Wzmocnij %s — dodaj dłuższe interwały VO₂max i powtórzenia progowe.", worst);
            case "TIME_TRIALIST" -> String.format("Popraw %s — dodaj pracę nad mocą maksymalną (sprinty, podjazdy).", worst);
            case "CLIMBER" -> String.format("Pracuj nad %s — dodaj sprinty i interwały anaerobowe.", worst);
            default -> String.format("Skup się na najsłabszym punkcie: %s (luka %.1f W/kg).", worst, gap);
        };
    }

    // ==================== Priority Ranking ====================

    private List<TrainingPriorityDto> rankPriorities(
            CpModelDto cp, IntervalDetectionDto intervals, FatigueFactorsDto fatigue,
            DurabilityProfileDto durability, PowerPhenotypeDto phenotype, double ftp) {

        List<PriorityCandidate> candidates = new ArrayList<>();

        // CP/W' signal
        if (cp.getCpConfidence() >= 50) {
            double gap = Math.abs(cp.getFtpVsCpPct() - 100);
            int impact = (int) Math.min(80, gap * 1.5);
            if (cp.getFtpVsCpPct() < 90) {
                candidates.add(new PriorityCandidate("cp_wprime",
                        "Podnieś FTP do poziomu CP",
                        String.format("Twoje CP (%.0fW) jest %.0f%% wyższe niż FTP (%.0fW) — potencjał do podniesienia progu.",
                                cp.getCp(), cp.getFtpVsCpPct(), ftp),
                        "Dodaj 2 sesje progowe/tydzień: 2×20min @ 95% FTP lub 3×12min SST.",
                        impact + 10, 2));
            } else if (cp.getFtpVsCpPct() > 110) {
                candidates.add(new PriorityCandidate("cp_wprime",
                        "Zwiększ pojemność anaerobową (W')",
                        String.format("FTP (%.0fW) jest blisko CP (%.0fW) — ogranicza Cię pojemność anaerobowa (W'=%.0f kJ).",
                                ftp, cp.getCp(), cp.getWPrime() / 1000),
                        "Dodaj interwały anaerobowe: 6-8×30s @ 150% FTP z pełnym odpoczynkiem.",
                        impact + 10, 2));
            }
        }

        // Interval detection
        if (intervals.getTotalIntervalSessions() == 0) {
            candidates.add(new PriorityCandidate("intervals",
                    "Wprowadź regularne interwały",
                    "Nie wykryto żadnych sesji interwałowych w ostatnich 90 dniach — brak bodźca progresji.",
                    "Zacznij od 1 sesji tygodniowo: 3×8min @ 95-100% FTP (SST).",
                    85, 2));
        } else if (intervals.getAvgQualityScore() < 50) {
            candidates.add(new PriorityCandidate("intervals",
                    "Popraw jakość interwałów",
                    "Interwały wykryte, ale jakość niska (śr. " + Math.round(intervals.getAvgQualityScore()) + "/100) — nierówna moc, słaba struktura.",
                    "Skup się na równomiernej mocy podczas pracy. Używaj trybu ERG na trenażerze.",
                    75, 1));
        } else {
            Map<String, Integer> byType = intervals.getSessionsByType();
            if (!byType.containsKey("VO2MAX") && !byType.containsKey("ANAEROBIC")) {
                candidates.add(new PriorityCandidate("intervals",
                        "Dodaj interwały VO₂max",
                        "Brak bodźca VO₂max — dodanie interwałów 3-5 min @ 105-115% FTP zwiększy pułap tlenowy.",
                        "1×/tydzień: 4-5×3min @ 110% FTP z 3min przerwy.",
                        70, 1));
            }
            if (!byType.containsKey("THRESHOLD") && intervals.getTotalIntervalSessions() < 5) {
                candidates.add(new PriorityCandidate("intervals",
                        "Zwiększ objętość progową",
                        "Mało czasu w strefie progowej — kluczowej dla podniesienia FTP.",
                        "Dodaj 2×20min @ 95% FTP 1-2×/tydzień.",
                        65, 2));
            }
        }

        // Fatigue
        if (fatigue.getCompositeScore() >= 70) {
            candidates.add(new PriorityCandidate("fatigue",
                    "Priorytet: regeneracja",
                    String.format("Wysokie zmęczenie wieloczynnikowe (%d/100) — mięśniowe, metaboliczne i ANS.",
                            fatigue.getCompositeScore()),
                    "Zaplanuj 3-5 dni aktywnej regeneracji. Sen 8+h, niskie tętno (<70% HRmax).",
                    95, 0));
        } else if (fatigue.getCompositeScore() >= 50) {
            candidates.add(new PriorityCandidate("fatigue",
                    "Kontroluj obciążenie",
                    String.format("Umiarkowane zmęczenie (%d/100). %s",
                            fatigue.getCompositeScore(), fatigue.getDescription()),
                    "Utrzymaj jakość, ale ogranicz objętość o 10-15% w tym tygodniu.",
                    55, 1));
        } else {
            candidates.add(new PriorityCandidate("fatigue",
                    "Wykorzystaj świeżość",
                    String.format("Niskie zmęczenie (%d/100) — idealny moment na progresję.",
                            fatigue.getCompositeScore()),
                    "To dobry tydzień na test FTP lub kluczową sesję jakościową.",
                    60, 2));
        }

        // Durability
        if (durability.getOverallScore() > 0 && durability.getOverallScore() < 50) {
            int impact = 75 - durability.getOverallScore() / 2;
            candidates.add(new PriorityCandidate("durability",
                    "Zbuduj odporność na zmęczenie",
                    durability.getDescription(),
                    durability.getRecommendation(),
                    Math.max(40, impact), 3));
        } else if (durability.getOverallScore() >= 50 && durability.getOverallScore() < 70) {
            candidates.add(new PriorityCandidate("durability",
                    "Wzmocnij wytrzymałość długą",
                    durability.getDescription(),
                    durability.getRecommendation(),
                    50, 2));
        }

        // Phenotype
        if (phenotype.getWeaknessGapWkg() > 1.0) {
            candidates.add(new PriorityCandidate("phenotype",
                    "Wyrównaj słaby punkt profilu",
                    String.format("Najsłabszy w %s (luka %.1f W/kg vs referencja). %s",
                            phenotype.getWorstDuration(), phenotype.getWeaknessGapWkg(),
                            phenotype.getDescription()),
                    phenotype.getRecommendation(),
                    65, 2));
        } else if (!"ALL_ROUNDER".equals(phenotype.getPrimaryType()) && phenotype.getWeaknessGapWkg() > 0.3) {
            candidates.add(new PriorityCandidate("phenotype",
                    "Rozwijaj słabsze systemy",
                    String.format("Specjalizacja w %s — zaniedbujesz %s (luka %.1f W/kg).",
                            phenotype.getPrimaryType(), phenotype.getWorstDuration(), phenotype.getWeaknessGapWkg()),
                    "Dodaj 1 sesję tygodniowo celującą w " + phenotype.getWorstDuration() + ".",
                    55, 1));
        }

        // Sort by impact descending, take top 5
        candidates.sort(Comparator.comparingInt(PriorityCandidate::impact).reversed());
        List<TrainingPriorityDto> result = new ArrayList<>();
        for (int i = 0; i < Math.min(5, candidates.size()); i++) {
            PriorityCandidate c = candidates.get(i);
            result.add(TrainingPriorityDto.builder()
                    .rank(i + 1).title(c.title).subsystem(c.subsystem)
                    .weeklyHours(c.weeklyHours).impactScore(c.impact)
                    .rationale(c.rationale).action(c.action)
                    .metricsSummary(c.rationale.length() > 100 ? c.rationale.substring(0, 97) + "..." : c.rationale)
                    .build());
        }

        if (result.isEmpty()) {
            result.add(TrainingPriorityDto.builder()
                    .rank(1).title("Kontynuuj obecny plan")
                    .subsystem("overall").weeklyHours(0).impactScore(50)
                    .rationale("Wszystkie systemy w normie — brak krytycznych słabości.")
                    .action("Utrzymaj regularność i progresję obciążeń.")
                    .metricsSummary("Systemy w równowadze").build());
        }
        return result;
    }

    private record PriorityCandidate(String subsystem, String title, String rationale,
                                     String action, int impact, int weeklyHours) {}
}
