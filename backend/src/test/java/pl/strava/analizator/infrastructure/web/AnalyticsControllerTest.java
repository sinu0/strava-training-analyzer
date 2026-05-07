package pl.strava.analizator.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.AnalyticsService;
import pl.strava.analizator.application.BlockHealthService;
import pl.strava.analizator.application.TrainingStatusService;
import pl.strava.analizator.application.dto.BlockHealthDto;
import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.DurabilityInsightDto;
import pl.strava.analizator.application.dto.DurabilityWorkoutDto;
import pl.strava.analizator.application.dto.PowerCurveDto;
import pl.strava.analizator.application.dto.ProgressionLevelDto;
import pl.strava.analizator.application.dto.ReadinessCheckInDto;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.application.dto.ReadinessHealthSignalsDto;
import pl.strava.analizator.application.dto.ReadinessSessionVariantDto;
import pl.strava.analizator.application.dto.ReadinessWindowDto;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@Import(SecurityConfig.class)
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnalyticsService analyticsService;
    @MockitoBean
    private BlockHealthService blockHealthService;
    @MockitoBean
    private TrainingStatusService trainingStatusService;

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

    @Test
    void readiness_returnsDayTypeFields() throws Exception {
        when(analyticsService.getReadiness()).thenReturn(ReadinessDto.builder()
                .score(38)
                .level("zmęczenie")
                .tsb(-18)
                .ctl(70)
                .atl(84)
                .description("Umiarkowana gotowość, lżejszy trening lub aktywny odpoczynek")
                .dayType("ENDURANCE")
                .dayLabel("Tlen")
                .dayFocus("Najlepszy będzie spokojny trening tlenowy z kontrolą obciążenia.")
                .sessionVariants(List.of(
                        ReadinessSessionVariantDto.builder()
                                .title("Krótki tlen")
                                .durationMinutes(45)
                                .targetPower("60-70% FTP")
                                .targetTss(35)
                                .fuelingHint("30-45 g węgli/h")
                                .recoveryHint("20-30 g białka po treningu")
                                .build()))
                .tomorrowHint("Jutro nadal spokojnie albo wejście w tempo, jeśli noga będzie świeża.")
                .bestQualityWindowLabel("Jutro")
                .qualityWindowSummary("Najlepsze okno jakości wypada jutro, jeśli dziś utrzymasz kontrolę obciążenia.")
                .qualityWindows(List.of(
                        ReadinessWindowDto.builder()
                                .date(LocalDate.of(2025, 1, 6))
                                .label("Dziś")
                                .score(38)
                                .recommendation("CONTROLLED")
                                .focus("Trzymaj spokojny tlen.")
                                .build(),
                        ReadinessWindowDto.builder()
                                .date(LocalDate.of(2025, 1, 7))
                                .label("Jutro")
                                .score(52)
                                .recommendation("BEST_QUALITY")
                                .focus("Najlepsze okno na jakościowy bodziec.")
                                .build()))
                .healthSignals(ReadinessHealthSignalsDto.builder()
                        .sourceDate(LocalDate.of(2025, 1, 6))
                        .sleepScore((short) 78)
                        .bodyBattery((short) 62)
                        .restingHrBpm((short) 51)
                        .scoreAdjustment(4)
                        .build())
                .checkIn(ReadinessCheckInDto.builder()
                        .date(LocalDate.of(2025, 1, 6))
                        .sleepQuality((short) 5)
                        .legFreshness((short) 3)
                        .motivation((short) 5)
                        .soreness((short) 1)
                        .scoreAdjustment(14)
                        .build())
                .build());

        mockMvc.perform(get("/api/analytics/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dayType", is("ENDURANCE")))
                .andExpect(jsonPath("$.dayLabel", is("Tlen")))
                .andExpect(jsonPath("$.sessionVariants[0].durationMinutes", is(45)))
                .andExpect(jsonPath("$.sessionVariants[0].fuelingHint", is("30-45 g węgli/h")))
                .andExpect(jsonPath("$.sessionVariants[0].recoveryHint", is("20-30 g białka po treningu")))
                .andExpect(jsonPath("$.tomorrowHint", is("Jutro nadal spokojnie albo wejście w tempo, jeśli noga będzie świeża.")))
                .andExpect(jsonPath("$.bestQualityWindowLabel", is("Jutro")))
                .andExpect(jsonPath("$.qualityWindows[1].recommendation", is("BEST_QUALITY")))
                .andExpect(jsonPath("$.healthSignals.sleepScore", is(78)))
                .andExpect(jsonPath("$.checkIn.scoreAdjustment", is(14)));
    }

    @Test
    void readinessCheckIn_updatesReadiness() throws Exception {
        when(analyticsService.saveReadinessCheckIn(any())).thenReturn(ReadinessDto.builder()
                .score(61)
                .level("dobra")
                .tsb(-6)
                .ctl(68)
                .atl(74)
                .description("Check-in podnosi gotowość mimo lekkiego zmęczenia.")
                .dayType("TEMPO")
                .dayLabel("Tempo")
                .build());

        mockMvc.perform(post("/api/analytics/readiness/check-in")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sleepQuality": 5,
                                  "legFreshness": 4,
                                  "motivation": 5,
                                  "soreness": 2
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score", is(61)))
                .andExpect(jsonPath("$.dayType", is("TEMPO")));
    }

    @Test
    void durability_returnsSummary() throws Exception {
        when(analyticsService.getDurabilityInsights()).thenReturn(DurabilityInsightDto.builder()
                .trend("FADE_RISK")
                .label("Końcówka siada")
                .description("W końcówce pracy widać drift.")
                .avgAerobicDecoupling(BigDecimal.valueOf(8.4))
                .avgPowerFade(BigDecimal.valueOf(6.1))
                .avgDurabilityScore(49)
                .workouts(List.of(DurabilityWorkoutDto.builder()
                        .activityId(UUID.randomUUID())
                        .date(LocalDate.of(2025, 1, 4))
                        .name("Long ride")
                        .durationMin(155)
                        .durabilityScore(49)
                        .build()))
                .build());

        mockMvc.perform(get("/api/analytics/durability"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trend", is("FADE_RISK")))
                .andExpect(jsonPath("$.avgDurabilityScore", is(49)))
                .andExpect(jsonPath("$.workouts[0].durationMin", is(155)));
    }

    @Test
    void progressionLevels_returnsSystems() throws Exception {
        when(analyticsService.getProgressionLevels()).thenReturn(List.of(
                ProgressionLevelDto.builder()
                        .system("THRESHOLD")
                        .label("Próg")
                        .level(6)
                        .currentLoad(BigDecimal.valueOf(82))
                        .previousLoad(BigDecimal.valueOf(55))
                        .targetLoad(BigDecimal.valueOf(70))
                        .trend("UP")
                        .description("Próg rośnie stabilnie.")
                        .nextRecommendation("Utrzymaj jeden mocny bodziec progowy.")
                        .build()
        ));

        mockMvc.perform(get("/api/analytics/progression-levels"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].system", is("THRESHOLD")))
                .andExpect(jsonPath("$[0].level", is(6)))
                .andExpect(jsonPath("$[0].trend", is("UP")));
    }

    @Test
    void blockHealth_returnsStructuredStatus() throws Exception {
        when(blockHealthService.getCurrentBlockHealth()).thenReturn(BlockHealthDto.builder()
                .status("OVER_ADJUSTED")
                .label("Za dużo korekt")
                .description("Blok nadal żyje, ale zbyt często ratujesz tydzień podmianami.")
                .objectiveLabel("Budowa progu")
                .programGoal("BUILD_PEAK")
                .goalExecutionStatus("PARTIAL")
                .goalExecutionScore(63)
                .adjustmentDays(3)
                .missedStimulusDays(1)
                .overloadDays(0)
                .keySignals(List.of("Korekty w 14 dniach: 3"))
                .nextFocus("Uspokój tydzień i obroń jeden próg.")
                .build());

        mockMvc.perform(get("/api/analytics/block-health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("OVER_ADJUSTED")))
                .andExpect(jsonPath("$.adjustmentDays", is(3)))
                .andExpect(jsonPath("$.keySignals[0]", is("Korekty w 14 dniach: 3")));
    }
}
