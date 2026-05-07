package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.TrainingStatusDto;
import pl.strava.analizator.application.dto.WeeklyBriefDto;
import pl.strava.analizator.application.dto.WeeklySummaryDto;
import pl.strava.analizator.domain.model.AthleteFatigueState;
import pl.strava.analizator.domain.model.Event;
import pl.strava.analizator.domain.model.LoadFocus;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.vo.DateRange;

@Service
@RequiredArgsConstructor
public class TrainingStatusService {

    private final AnalyticsService analyticsService;
    private final FatigueAndEnergyService fatigueService;
    private final EventService eventService;
    private final DailyMetricRepository dailyMetricRepository;

    public TrainingStatusDto getTrainingStatus() {
        LocalDate today = LocalDate.now();
        List<PmcDataDto> pmc = analyticsService.getPmc(today.minusDays(30), today);
        AthleteFatigueState fatigue = fatigueService.getCurrentFatigue(today);

        if (pmc.isEmpty()) return TrainingStatusDto.builder().status("UNKNOWN").label("Brak danych").build();

        int n = pmc.size();
        PmcDataDto current = pmc.get(n - 1);
        double ctl = current.getCtl().doubleValue();
        double tsb = current.getTsb().doubleValue();

        double ctl14d = 0, ctl7d = 0;
        int half = Math.max(0, n - 14);
        for (int i = half; i < Math.min(n, half + 7); i++) ctl14d += pmc.get(i).getCtl().doubleValue();
        for (int i = Math.max(half, n - 7); i < n; i++) ctl7d += pmc.get(i).getCtl().doubleValue();
        int count = Math.min(7, n - half);
        ctl14d /= Math.max(1, count);
        ctl7d /= Math.max(1, n - Math.max(half, n - 7));
        double trend = (ctl7d - ctl14d) * 2;

        int fatigueScore = fatigue.getScore();
        String status = computeStatus(trend, tsb, fatigueScore, ctl);

        return TrainingStatusDto.builder()
                .status(status)
                .label(translateStatus(status))
                .description(buildStatusDescription(status, trend, ctl, tsb))
                .ctlTrend(Math.round(trend * 10.0) / 10.0)
                .currentCtl(Math.round(ctl * 10.0) / 10.0)
                .currentTsb(Math.round(tsb * 10.0) / 10.0)
                .fatigue(fatigueScore)
                .build();
    }

    public WeeklyBriefDto getWeeklyBrief() {
        LocalDate today = LocalDate.now();
        TrainingStatusDto status = getTrainingStatus();
        AthleteFatigueState fatigue = fatigueService.getCurrentFatigue(today);
        LoadFocus loadFocus = fatigueService.getLoadFocus(4);

        List<WeeklySummaryDto> weekly = analyticsService.getWeeklySummaries(12);
        WeeklySummaryDto lastWeek = weekly.isEmpty() ? null : weekly.get(0);

        double weeklyHours = 0, weeklyTss = 0;
        if (lastWeek != null) {
            weeklyHours = lastWeek.getTotalTimeSec() / 3600.0;
            if (lastWeek.getTotalTss() != null) weeklyTss = lastWeek.getTotalTss().doubleValue();
        }
        double avg4wH = 0, avg4wT = 0;
        for (int i = 0; i < Math.min(4, weekly.size()); i++) {
            var w = weekly.get(i);
            avg4wH += w.getTotalTimeSec() / 3600.0;
            if (w.getTotalTss() != null) avg4wT += w.getTotalTss().doubleValue();
        }
        avg4wH /= Math.max(1, Math.min(4, weekly.size()));
        avg4wT /= Math.max(1, Math.min(4, weekly.size()));

        double efTrend = readMetric(today, "efficiency_factor");
        int fatigueLastWeek = readMetricInt(today.minusDays(7), "fatigue_score");

        List<Event> events = eventService.findActive();
        Event nextEvent = events.isEmpty() ? null : events.get(0);

        String suggestedFocus = computeSuggestedFocus(loadFocus, status.getStatus());
        double projectedCtl = 0;
        if (nextEvent != null) {
            double trend = status.getCtlTrend();
            int days = daysToEvent(nextEvent.getEventDate(), today);
            if (days > 0) {
                double raw = status.getCurrentCtl() + trend * (days / 7.0);
                projectedCtl = Math.min(raw, status.getCurrentCtl() * 1.5);
            }
        }

        return WeeklyBriefDto.builder()
                .status(status.getStatus())
                .statusDescription(status.getDescription())
                .weeklyHours(Math.round(weeklyHours * 10.0) / 10.0)
                .weeklyTss(Math.round(weeklyTss))
                .avg4WeekHours(Math.round(avg4wH * 10.0) / 10.0)
                .avg4WeekTss(Math.round(avg4wT))
                .efTrend(Math.round(efTrend * 100.0) / 100.0)
                .fatigueScore(fatigue.getScore())
                .fatigueLastWeek(fatigueLastWeek)
                .fatigueTrend(fatigue.getTrend())
                .eventName(nextEvent != null ? nextEvent.getName() : null)
                .daysToEvent(nextEvent != null ? daysToEvent(nextEvent.getEventDate(), today) : 0)
                .projectedCtl(Math.round(projectedCtl * 10.0) / 10.0)
                .suggestedFocus(suggestedFocus)
                .loadFocusLowPct(loadFocus.getLowAerobicPct())
                .loadFocusHighPct(loadFocus.getHighAerobicPct())
                .loadFocusAnaerobicPct(loadFocus.getAnaerobicPct())
                .build();
    }

    private String computeStatus(double trend, double tsb, int fatigue, double ctl) {
        if (fatigue > 80) return "STRAINED";
        if (tsb < -20) return "OVERREACHING";
        if (trend > 3) return "OVERREACHING";
        if (trend > 1 && tsb > -15 && fatigue < 60) return "PRODUCTIVE";
        if (tsb > 5) return "RECOVERY";
        if (trend < -2) return "DETRAINING";
        if (trend >= -1 && trend <= 1 && fatigue < 50) return "MAINTAINING";
        return "MAINTAINING";
    }

    private String translateStatus(String s) {
        return switch (s) {
            case "PRODUCTIVE" -> "Forma rośnie";
            case "MAINTAINING" -> "Utrzymanie";
            case "OVERREACHING" -> "Przeciążenie";
            case "DETRAINING" -> "Spadek formy";
            case "RECOVERY" -> "Regeneracja";
            case "STRAINED" -> "Przemęczenie";
            default -> "Brak danych";
        };
    }

    private String buildStatusDescription(String status, double trend, double ctl, double tsb) {
        return switch (status) {
            case "PRODUCTIVE" -> String.format("CTL +%.1f/tydz — dokładaj jakość", trend);
            case "MAINTAINING" -> String.format("CTL stabilne (%.0f) — czas na progresję?", ctl);
            case "OVERREACHING" -> String.format("Zwolnij tempo — TSB %.0f, trend CTL +%.1f", tsb, trend);
            case "DETRAINING" -> String.format("CTL spada %.1f/tydz — wróć do regularności", trend);
            case "RECOVERY" -> "Świeży — dobry moment na jakość";
            case "STRAINED" -> "Priorytet: regeneracja";
            default -> "";
        };
    }

    private String computeSuggestedFocus(LoadFocus focus, String status) {
        if ("STRAINED".equals(status) || "OVERREACHING".equals(status)) return "Regeneracja + lekka jazda";
        if (focus.getHighAerobicPct() < 15) return "Threshold/Sweet Spot";
        if (focus.getLowAerobicPct() < 50) return "Wytrzymałość (Z2)";
        return "Zrównoważony: 1x intensywny + 2x wytrzymałość";
    }

    private int daysToEvent(LocalDate eventDate, LocalDate today) {
        return (int) ChronoUnit.DAYS.between(today, eventDate);
    }

    private double readMetric(LocalDate date, String name) {
        Map<LocalDate, BigDecimal> series = dailyMetricRepository.findNumericSeries(name, DateRange.of(date, date));
        BigDecimal val = series.get(date);
        return val != null ? val.doubleValue() : 0;
    }

    private int readMetricInt(LocalDate date, String name) {
        return (int) Math.round(readMetric(date, name));
    }
}
