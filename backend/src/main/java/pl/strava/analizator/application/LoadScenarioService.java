package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.LoadScenarioDto;
import pl.strava.analizator.application.dto.LoadScenarioPointDto;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.TrainingPlanDto;

@Service
@RequiredArgsConstructor
public class LoadScenarioService {

    private final AnalyticsService analyticsService;
    private final TrainingPlanService trainingPlanService;

    public LoadScenarioDto calculate(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) throw new IllegalArgumentException("'from' must be before 'to'");
        if (to.isAfter(from.plusDays(90))) throw new IllegalArgumentException("Scenario range cannot exceed 90 days");

        LocalDate baselineDate = from.minusDays(1);
        List<PmcDataDto> baselinePoints = analyticsService.getPmc(baselineDate, baselineDate);
        PmcDataDto baseline = baselinePoints.isEmpty() ? null : baselinePoints.get(0);
        if (baseline == null || isMissingBaseline(baseline)) {
            return LoadScenarioDto.builder()
                    .from(from).to(to).availability("UNKNOWN")
                    .assumptions(List.of("Brak bieżących CTL/ATL; scenariusz nie został policzony od sztucznego zera."))
                    .points(List.of()).build();
        }

        Map<LocalDate, BigDecimal> plannedTss = trainingPlanService.getPlans(from, to).stream()
                .collect(Collectors.toMap(TrainingPlanDto::getDate,
                        plan -> plan.getPlannedTss() != null ? plan.getPlannedTss() : BigDecimal.ZERO,
                        BigDecimal::add));
        double ctl = baseline.getCtl().doubleValue();
        double atl = baseline.getAtl().doubleValue();
        List<LoadScenarioPointDto> points = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            BigDecimal tss = plannedTss.getOrDefault(date, BigDecimal.ZERO);
            ctl += (tss.doubleValue() - ctl) / 42.0;
            atl += (tss.doubleValue() - atl) / 7.0;
            points.add(LoadScenarioPointDto.builder()
                    .date(date)
                    .plannedTss(tss)
                    .ctl(decimal(ctl))
                    .atl(decimal(atl))
                    .form(decimal(ctl - atl))
                    .build());
        }
        return LoadScenarioDto.builder()
                .from(from).to(to).availability("AVAILABLE")
                .assumptions(List.of(
                        "Scenariusz deterministyczny, nie prognoza wyniku.",
                        "CTL ma stałą czasową 42 dni, ATL 7 dni.",
                        "Dni bez zaplanowanego TSS przyjmują obciążenie 0."))
                .points(points).build();
    }

    private boolean isMissingBaseline(PmcDataDto baseline) {
        return baseline.getCtl() == null || baseline.getAtl() == null
                || (baseline.getCtl().compareTo(BigDecimal.ZERO) == 0
                && baseline.getAtl().compareTo(BigDecimal.ZERO) == 0);
    }

    private BigDecimal decimal(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }
}
