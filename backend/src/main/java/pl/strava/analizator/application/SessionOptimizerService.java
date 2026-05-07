package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.AthleteFatigueState;
import pl.strava.analizator.domain.model.LoadFocus;
import pl.strava.analizator.domain.model.SessionSuggestion;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.vo.DateRange;

@Service
@RequiredArgsConstructor
public class SessionOptimizerService {

    private final FatigueAndEnergyService fatigueService;
    private final AnalyticsService analyticsService;
    private final DailyMetricRepository dailyMetricRepository;

    private record SessionPreset(String type, String label, int minDuration, int maxDuration, int tssPer60Min, double baseIf, int minFreshness) {}

    private static final List<SessionPreset> PRESETS = List.of(
        new SessionPreset("RECOVERY", "Regeneracja aktywna", 20, 60, 20, 0.55, 999),
        new SessionPreset("ENDURANCE", "Wytrzymałość (Z2)", 30, 180, 40, 0.70, 999),
        new SessionPreset("TEMPO", "Tempo (Z3)", 30, 120, 55, 0.82, 50),
        new SessionPreset("SWEET_SPOT", "Sweet Spot (88-94% FTP)", 30, 90, 65, 0.90, 40),
        new SessionPreset("THRESHOLD", "Próg (95-105% FTP)", 45, 90, 75, 0.98, 30),
        new SessionPreset("VO2MAX", "VO2max (106-120% FTP)", 30, 60, 60, 1.05, 20)
    );

    private static final Map<String, String> STRUCTURES = Map.of(
        "RECOVERY", "Stałe tempo Z1, kadencja 85-95rpm",
        "ENDURANCE", "Stałe tempo Z2, kadencja 85-95rpm",
        "TEMPO", "Stałe tempo Z3, progresja co 15min",
        "SWEET_SPOT", "2x20min SS (88-94% FTP), 5min przerwy",
        "THRESHOLD", "2x15min FTP (95-105%), 5min przerwy. Kadencja 70-85rpm",
        "VO2MAX", "5x3min VO2max (110-120%), 3min przerwy"
    );

    public List<SessionSuggestion> suggest(int availableMinutes) {
        LocalDate today = LocalDate.now();
        AthleteFatigueState fatigue = fatigueService.getCurrentFatigue(today);
        LoadFocus loadFocus = fatigueService.getLoadFocus(4);
        double ctl = readMetric(today, "ctl");

        List<SessionSuggestion> candidates = new ArrayList<>();

        for (SessionPreset p : PRESETS) {
            if (availableMinutes < p.minDuration()) continue;
            if (fatigue.getScore() > p.minFreshness()) continue;

            int duration = Math.min(availableMinutes, p.maxDuration());
            int tss = (int) Math.round(p.tssPer60Min() * (duration / 60.0));
            double ifVal = Math.round(p.baseIf() * 1000.0) / 1000.0;

            int qualityImpact = computeQualityImpact(p.type(), loadFocus);
            int freshnessFactor = fatigue.getScore() < p.minFreshness() ? 10 : Math.max(1, 10 - fatigue.getScore() / 8);
            int roiScore = qualityImpact * freshnessFactor;

            String rationale = buildRationale(p.type(), loadFocus, fatigue);
            String impact = buildImpact(tss, ctl);

            candidates.add(SessionSuggestion.builder()
                    .type(p.type())
                    .label(p.label())
                    .durationMin(duration)
                    .estimatedTss(tss)
                    .estimatedIf(ifVal)
                    .structure(STRUCTURES.getOrDefault(p.type(), ""))
                    .rationale(rationale)
                    .roiScore(roiScore)
                    .impact(impact)
                    .build());
        }

        candidates.sort(Comparator.comparingInt(SessionSuggestion::getRoiScore).reversed());
        return candidates.subList(0, Math.min(3, candidates.size()));
    }

    private int computeQualityImpact(String type, LoadFocus focus) {
        return switch (type) {
            case "THRESHOLD", "SWEET_SPOT" -> focus.getHighAerobicPct() < 25 ? 12 : 8;
            case "TEMPO" -> focus.getHighAerobicPct() < 30 ? 10 : 6;
            case "VO2MAX" -> focus.getAnaerobicPct() < 5 ? 10 : 6;
            case "ENDURANCE" -> focus.getLowAerobicPct() < 60 ? 10 : 6;
            case "RECOVERY" -> 4;
            default -> 6;
        };
    }

    private String buildRationale(String type, LoadFocus focus, AthleteFatigueState fatigue) {
        double highPct = focus.getHighAerobicPct();
        double lowPct = focus.getLowAerobicPct();
        return switch (type) {
            case "THRESHOLD", "SWEET_SPOT" -> highPct < 25
                    ? String.format("Brakuje High Aerobic (%.0f%% vs cel ~20-25%%) — potrzebujesz intensywności", highPct)
                    : "Dobry moment na jakość";
            case "VO2MAX" -> "VO2max rozwija pułap tlenowy";
            case "ENDURANCE" -> lowPct < 60
                    ? String.format("Baza tlenowa niska (%.0f%%) — dodaj długie Z2", lowPct)
                    : "Solidna baza — utrzymuj";
            case "RECOVERY" -> String.format("Zmęczenie %d/100 — regeneracja to podstawa", fatigue.getScore());
            case "TEMPO" -> "Tempo buduje wytrzymałość szybkościową";
            default -> "";
        };
    }

    private String buildImpact(int tss, double ctl) {
        double ctlImpact = tss / (ctl > 0 ? ctl : 40) * 1.5;
        return String.format("~+%.1f CTL · %d TSS", ctlImpact, tss);
    }

    private double readMetric(LocalDate date, String metricName) {
        Map<LocalDate, BigDecimal> series = dailyMetricRepository.findNumericSeries(
                metricName, DateRange.of(date, date));
        BigDecimal val = series.get(date);
        return val != null ? val.doubleValue() : 0;
    }
}
