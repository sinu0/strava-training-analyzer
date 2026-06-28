package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.ZoneDistributionDto;
import pl.strava.analizator.domain.model.AthleteFatigueState;
import pl.strava.analizator.domain.model.LoadFocus;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.vo.DateRange;

@Component
@RequiredArgsConstructor
public class FatigueAndEnergyService {

    private final DailyMetricRepository dailyMetricRepository;
    private final AnalyticsService analyticsService;

    public AthleteFatigueState getCurrentFatigue(LocalDate date) {
        LocalDate from = date.minusDays(30);
        DateRange range = DateRange.of(from, date);
        List<PmcDataDto> pmc = analyticsService.getPmc(from, date);

        if (pmc.isEmpty()) {
            return AthleteFatigueState.builder().score(0).level("Brak danych").calculatedAt(Instant.now()).build();
        }

        PmcDataDto today = pmc.get(pmc.size() - 1);
        double ctl = today.getCtl().doubleValue();
        double atl = today.getAtl().doubleValue();
        double tsb = today.getTsb().doubleValue();

        int atlFatigue = computeAtlFatigue(atl, ctl);
        int metabolicFatigue = computeMetabolicFatigue(date, range);
        int loadFatigue = computeLoadFatigue(tsb);
        int recoveryDebt = computeRecoveryDebt(pmc);

        int rawScore = atlFatigue + metabolicFatigue + loadFatigue + recoveryDebt;

        double monotony = readMetric(date, "training_monotony");
        double strain = readMetric(date, "training_strain");
        double weeklyRampRate = computeWeeklyRampRate(pmc);
        String trend = computeTrend(pmc);

        Double recoveryEfficiency = computeRecoveryEfficiency(date);
        double recoveryEff = recoveryEfficiency != null ? recoveryEfficiency : 0;

        String level = rawScore <= 20 ? "Świeży" :
                rawScore <= 40 ? "Lekko zmęczony" :
                        rawScore <= 60 ? "Zmęczony" :
                                rawScore <= 80 ? "Bardzo zmęczony" : "Przeciążony";

        return AthleteFatigueState.builder()
                .score(rawScore)
                .level(level)
                .atlFatigue(atlFatigue)
                .metabolicFatigue(metabolicFatigue)
                .loadFatigue(loadFatigue)
                .recoveryDebt(recoveryDebt)
                .monotony(monotony)
                .strain(strain)
                .weeklyRampRate(weeklyRampRate)
                .trend(trend)
                .recoveryEfficiency(recoveryEff)
                .calculatedAt(Instant.now())
                .build();
    }

    public LoadFocus getLoadFocus(int weeks) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(weeks * 7L);
        ZoneDistributionDto powerZones = analyticsService.getZoneDistribution("power", from, to);

        double low = 0, high = 0, anaerobic = 0;
        for (Map.Entry<String, Double> e : powerZones.getZones().entrySet()) {
            int zoneNum = parseZoneNumber(e.getKey());
            double secs = e.getValue();
            if (zoneNum == 2) low += secs;           // Endurance only
            else if (zoneNum == 3 || zoneNum == 4) high += secs;  // Tempo + Threshold
            else if (zoneNum >= 5) anaerobic += secs; // VO2max+
            // Z1 is excluded (recovery/coasting)
        }

        double total = low + high + anaerobic;
        double lowPct = total > 0 ? (low / total) * 100 : 0;
        double highPct = total > 0 ? (high / total) * 100 : 0;
        double anPct = total > 0 ? (anaerobic / total) * 100 : 0;

        return LoadFocus.builder()
                .lowAerobicPct(Math.round(lowPct * 10.0) / 10.0)
                .highAerobicPct(Math.round(highPct * 10.0) / 10.0)
                .anaerobicPct(Math.round(anPct * 10.0) / 10.0)
                .lowAerobicTarget(75.0)
                .highAerobicTarget(17.0)
                .anaerobicTarget(8.0)
                .zoneSeconds(new LinkedHashMap<>(powerZones.getZones()))
                .totalSeconds(powerZones.getTotalSeconds())
                .build();
    }

    public int getEnergyBudget(LocalDate date) {
        AthleteFatigueState fatigue = getCurrentFatigue(date);
        double sleepBonus = readMetric(date, "sleep_score");
        double sleepAdj = sleepBonus > 0 ? (sleepBonus - 50) * 0.3 : 0;

        Double yesterdayTss = readMetric(date.minusDays(1), "daily_tss");
        double yesterdayPenalty = yesterdayTss > 100 ? (yesterdayTss - 100) * 0.15 : 0;

        double budget = 100 - fatigue.getScore() * 0.7 + sleepAdj - yesterdayPenalty;
        return (int) Math.max(0, Math.min(100, Math.round(budget)));
    }

    public int getMaxTssToday(LocalDate date) {
        LocalDate yesterday = date.minusDays(1);
        double ctl = readMetric(yesterday, "ctl");
        if (ctl <= 0) ctl = readMetric(yesterday.minusDays(1), "ctl");
        if (ctl <= 0) return 0;

        int energy = getEnergyBudget(date);
        return (int) Math.round(energy * ctl * 0.015);
    }

    // ── Component calculators ──

    private int computeAtlFatigue(double atl, double ctl) {
        if (ctl <= 0) return 10;
        double ratio = atl / ctl;
        return (int) Math.max(0, Math.min(25, (ratio - 0.85) / 0.04));
    }

    private int computeMetabolicFatigue(LocalDate date, DateRange range) {
        double monotony = readMetric(date, "training_monotony");
        double monotonyFactor = monotony > 2.0 ? 1.3 : (monotony > 1.5 ? 1.1 : 1.0);
        double weeklyTss = 0;
        for (int i = 0; i < 7; i++) {
            weeklyTss += readMetric(date.minusDays(i), "daily_tss");
        }
        double ctl = readMetric(date, "ctl");
        double safeWeekly = Math.max(100, ctl * 7 * 1.3);
        double ratio = weeklyTss / safeWeekly;
        return (int) Math.max(0, Math.min(25, ratio * 15 * monotonyFactor));
    }

    private int computeLoadFatigue(double tsb) {
        return (int) Math.max(0, Math.min(25, Math.max(0, -tsb) / 1.6));
    }

    private int computeRecoveryDebt(List<PmcDataDto> pmc) {
        int daysDeepNegative = 0;
        for (int i = Math.max(0, pmc.size() - 14); i < pmc.size(); i++) {
            if (pmc.get(i).getTsb().doubleValue() < -10) daysDeepNegative++;
        }
        return (int) Math.max(0, Math.min(25, daysDeepNegative * 2.0));
    }

    private double computeWeeklyRampRate(List<PmcDataDto> pmc) {
        if (pmc.size() < 14) return 0;
        int n = pmc.size();
        double recentWeek = 0, prevWeek = 0;
        for (int i = n - 7; i < n; i++) recentWeek += pmc.get(i).getCtl().doubleValue();
        for (int i = Math.max(0, n - 14); i < n - 7; i++) prevWeek += pmc.get(i).getCtl().doubleValue();
        if (prevWeek <= 0) return 0;
        return Math.round(((recentWeek - prevWeek) / prevWeek) * 1000.0) / 10.0;
    }

    private Double computeRecoveryEfficiency(LocalDate date) {
        if (date == null) return null;
        LocalDate yesterday = date.minusDays(1);
        List<PmcDataDto> recentPmc = analyticsService.getPmc(yesterday.minusDays(1), date);
        if (recentPmc.size() < 2) return null;

        double atlToday = recentPmc.get(recentPmc.size() - 1).getAtl().doubleValue();
        double atlYesterday = recentPmc.get(recentPmc.size() - 2).getAtl().doubleValue();
        double ctlToday = recentPmc.get(recentPmc.size() - 1).getCtl().doubleValue();
        double ctlYesterday = recentPmc.get(recentPmc.size() - 2).getCtl().doubleValue();

        double fatigueToday = roughFatigue(atlToday, ctlToday);
        double fatigueYesterday = roughFatigue(atlYesterday, ctlYesterday);
        double dropped = fatigueYesterday - fatigueToday;

        if (dropped <= 0) return null;

        double sleepHours = readMetric(date, "sleep_duration_hours");
        if (sleepHours <= 0) sleepHours = 7.0;

        return Math.round(dropped / sleepHours * 10.0) / 10.0;
    }

    private double roughFatigue(double atl, double ctl) {
        double ratio = ctl > 0 ? atl / ctl : 0;
        return Math.max(0, Math.min(100, ratio * 50));
    }

    private String computeTrend(List<PmcDataDto> pmc) {
        if (pmc.size() < 10) return "stabilne";
        int n = pmc.size();
        double recent = 0, older = 0;
        for (int i = n - 5; i < n; i++) recent += pmc.get(i).getAtl().doubleValue();
        for (int i = n - 10; i < n - 5; i++) older += pmc.get(i).getAtl().doubleValue();
        double change = (recent - older) / Math.max(1, older);
        if (change > 0.1) return "rosnące";
        if (change < -0.1) return "malejące";
        return "stabilne";
    }

    private double readMetric(LocalDate date, String metricName) {
        Map<LocalDate, BigDecimal> series = dailyMetricRepository.findNumericSeries(
                metricName, DateRange.of(date, date));
        BigDecimal val = series.get(date);
        return val != null ? val.doubleValue() : 0;
    }

    private int parseZoneNumber(String key) {
        try {
            String num = key.replaceAll("[^0-9]", "");
            return num.isEmpty() ? 0 : Integer.parseInt(num);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
