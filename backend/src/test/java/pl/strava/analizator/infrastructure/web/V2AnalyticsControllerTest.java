package pl.strava.analizator.infrastructure.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.AnalyticsService;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.vo.DateRange;

@ExtendWith(MockitoExtension.class)
class V2AnalyticsControllerTest {

    @Mock private AnalyticsService analyticsService;
    @Mock private DailyMetricRepository dailyMetricRepository;

    @Test
    void loadIsPartialWhenPmcExistsButLoadCoverageIsLow() {
        LocalDate from = LocalDate.of(2026, 8, 1);
        LocalDate to = LocalDate.of(2026, 8, 21);
        when(analyticsService.getPmc(from, to)).thenReturn(List.of(PmcDataDto.builder()
                .date(to).ctl(BigDecimal.valueOf(42)).atl(BigDecimal.valueOf(51))
                .tsb(BigDecimal.valueOf(-9)).build()));
        when(dailyMetricRepository.findNumericSeries(eq("training_load_coverage"),
                org.mockito.ArgumentMatchers.any(DateRange.class)))
                .thenReturn(Map.of(to, BigDecimal.valueOf(0.4)));

        var result = new V2AnalyticsController(analyticsService, dailyMetricRepository).load(from, to);

        assertThat(result.getAvailability()).isEqualTo("PARTIAL");
        assertThat(result.getCoverage()).isEqualByComparingTo("0.4");
    }
}
