package pl.strava.analizator.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.AnalyticsService;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.PowerCurveDto;
import pl.strava.analizator.application.dto.TrendDto;
import pl.strava.analizator.application.dto.WeeklyMmpDto;
import pl.strava.analizator.application.dto.WeeklySummaryDto;
import pl.strava.analizator.application.dto.ZoneDistributionDto;
import pl.strava.analizator.infrastructure.config.SecurityConfig;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@Import(SecurityConfig.class)
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnalyticsService analyticsService;

    @Test
    void pmc_returnsSeries() throws Exception {
        LocalDate from = LocalDate.of(2024, 1, 1);
        LocalDate to = LocalDate.of(2024, 1, 3);

        var data = List.of(
                PmcDataDto.builder().date(from).ctl(BigDecimal.valueOf(50)).atl(BigDecimal.valueOf(60)).tsb(BigDecimal.valueOf(-10)).build(),
                PmcDataDto.builder().date(from.plusDays(1)).ctl(BigDecimal.valueOf(51)).atl(BigDecimal.valueOf(58)).tsb(BigDecimal.valueOf(-7)).build()
        );

        when(analyticsService.getPmc(from, to)).thenReturn(data);

        mockMvc.perform(get("/api/analytics/pmc")
                        .param("from", "2024-01-01")
                        .param("to", "2024-01-03"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].ctl", is(50)));
    }

    @Test
    void powerCurve_returnsEfforts() throws Exception {
        Map<Integer, Double> efforts = new TreeMap<>(Map.of(5, 850.0, 60, 420.0, 300, 310.0));
        when(analyticsService.getPowerCurve(any(), any()))
                .thenReturn(PowerCurveDto.builder().efforts(efforts).build());

        mockMvc.perform(get("/api/analytics/power-curve")
                        .param("from", "2024-01-01")
                        .param("to", "2024-06-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.efforts.5", is(850.0)));
    }

    @Test
    void weeklyMmp_returnsSeries() throws Exception {
        LocalDate from = LocalDate.of(2024, 1, 1);
        LocalDate to = LocalDate.of(2024, 3, 31);

        when(analyticsService.getWeeklyMmp(from, to))
                .thenReturn(List.of(
                        new WeeklyMmpDto("2024-W01", LocalDate.of(2024, 1, 1), Map.of("5min", 320, "20min", 280))
                ));

        mockMvc.perform(get("/api/analytics/weekly-mmp")
                        .param("from", "2024-01-01")
                        .param("to", "2024-03-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].weekLabel", is("2024-W01")))
                .andExpect(jsonPath("$[0].bestEfforts.5min", is(320)));
    }

    @Test
    void zones_returnsDistribution() throws Exception {
        when(analyticsService.getZoneDistribution(eq("power"), any(), any()))
                .thenReturn(ZoneDistributionDto.builder()
                        .zoneType("power")
                        .zones(Map.of("Z1", 10.0, "Z2", 30.0, "Z3", 25.0, "Z4", 20.0, "Z5", 15.0))
                        .totalSeconds(3600)
                        .build());

        mockMvc.perform(get("/api/analytics/zones")
                        .param("zoneType", "power")
                        .param("from", "2024-01-01")
                        .param("to", "2024-06-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.zoneType", is("power")))
                .andExpect(jsonPath("$.totalSeconds", is(3600)));
    }

    @Test
    void weekly_returnsWeeklySummaries() throws Exception {
        when(analyticsService.getWeeklySummaries(8))
                .thenReturn(List.of(WeeklySummaryDto.builder()
                        .weekStart(LocalDate.of(2024, 5, 27))
                        .activityCount(3)
                        .totalDistanceM(BigDecimal.valueOf(120000))
                        .totalTimeSec(10800)
                        .totalElevationM(BigDecimal.valueOf(1500))
                        .totalTss(BigDecimal.valueOf(250))
                        .build()));

        mockMvc.perform(get("/api/analytics/weekly").param("weeks", "8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].activityCount", is(3)));
    }

    @Test
    void summary_returnsAggregateStats() throws Exception {
        when(analyticsService.getSummary("month"))
                .thenReturn(Map.of(
                        "activityCount", 12,
                        "totalDistanceM", BigDecimal.valueOf(500000),
                        "totalTimeSec", 43200
                ));

        mockMvc.perform(get("/api/analytics/summary").param("period", "month"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activityCount", is(12)));
    }

    @Test
    void pmc_invalidDateRange_returns400() throws Exception {
        mockMvc.perform(get("/api/analytics/pmc")
                        .param("from", "2024-06-01")
                        .param("to", "2024-01-01"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void compare_returnsTwoPeriods() throws Exception {
        when(analyticsService.comparePeriods(any(), any(), any(), any()))
                .thenReturn(Map.of(
                        "period1", Map.of("activityCount", 10),
                        "period2", Map.of("activityCount", 15)
                ));

        mockMvc.perform(get("/api/analytics/compare")
                        .param("period1From", "2024-01-01")
                        .param("period1To", "2024-03-31")
                        .param("period2From", "2024-04-01")
                        .param("period2To", "2024-06-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period1.activityCount", is(10)))
                .andExpect(jsonPath("$.period2.activityCount", is(15)));
    }
}
