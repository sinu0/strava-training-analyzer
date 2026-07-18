package pl.strava.analizator.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.AnalyticsService;
import pl.strava.analizator.application.dto.AnalyticsOverviewDto;
import pl.strava.analizator.application.dto.LoadAnalyticsDto;
import pl.strava.analizator.application.dto.PeriodComparisonDto;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.PowerAnalyticsDto;
import pl.strava.analizator.application.dto.PowerCurveDto;
import pl.strava.analizator.application.dto.WeeklySummaryDto;

@RestController
@RequestMapping("/api/v2/analytics")
@RequiredArgsConstructor
public class V2AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public AnalyticsOverviewDto overview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateRange(from, to);
        List<WeeklySummaryDto> weeks = analyticsService.getWeeklySummaries(
                Math.max(1, Math.min(156, (int) Math.ceil((to.toEpochDay() - from.toEpochDay() + 1) / 7.0))));
        return AnalyticsOverviewDto.builder()
                .from(from)
                .to(to)
                .availability(weeks.stream().anyMatch(week -> week.getActivityCount() > 0) ? "AVAILABLE" : "UNKNOWN")
                .ftp(analyticsService.getFtpProgress(from, to))
                .weeks(weeks)
                .build();
    }

    @GetMapping("/compare")
    public PeriodComparisonDto compare(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period1From,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period1To,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period2From,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period2To) {
        validateRange(period1From, period1To);
        validateRange(period2From, period2To);
        return analyticsService.comparePeriodsTyped(period1From, period1To, period2From, period2To);
    }

    @GetMapping("/load")
    public LoadAnalyticsDto load(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateRange(from, to);
        List<PmcDataDto> points = analyticsService.getPmc(from, to);
        boolean available = points.stream().anyMatch(point -> nonZero(point.getCtl())
                || nonZero(point.getAtl()) || nonZero(point.getTsb()));
        return LoadAnalyticsDto.builder().from(from).to(to)
                .availability(available ? "AVAILABLE" : "UNKNOWN")
                .points(points).build();
    }

    @GetMapping("/power")
    public PowerAnalyticsDto power(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateRange(from, to);
        PowerCurveDto curve = analyticsService.getPowerCurve(from, to);
        boolean available = curve.getEfforts() != null && !curve.getEfforts().isEmpty();
        return PowerAnalyticsDto.builder().from(from).to(to)
                .availability(available ? "AVAILABLE" : "UNKNOWN")
                .curve(curve)
                .ftp(analyticsService.getFtpProgress(from, to))
                // Withheld from V2 until the sampling assumptions and backtest are validated.
                .durability(null)
                .build();
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) throw new IllegalArgumentException("'from' must be before 'to'");
    }

    private boolean nonZero(BigDecimal value) {
        return value != null && value.compareTo(BigDecimal.ZERO) != 0;
    }
}
