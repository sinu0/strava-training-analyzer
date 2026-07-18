package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.PmcDataDto;
import pl.strava.analizator.application.dto.TrainingPlanDto;

@ExtendWith(MockitoExtension.class)
class LoadScenarioServiceTest {

    @Mock private AnalyticsService analyticsService;
    @Mock private TrainingPlanService trainingPlanService;
    private LoadScenarioService service;

    @BeforeEach
    void setUp() {
        service = new LoadScenarioService(analyticsService, trainingPlanService);
    }

    @Test
    void returnsUnknownInsteadOfCalculatingFromFabricatedZeroBaseline() {
        LocalDate from = LocalDate.of(2026, 7, 20);
        PmcDataDto missing = PmcDataDto.builder().date(from.minusDays(1))
                .ctl(BigDecimal.ZERO).atl(BigDecimal.ZERO).tsb(BigDecimal.ZERO).build();
        when(analyticsService.getPmc(from.minusDays(1), from.minusDays(1))).thenReturn(List.of(missing));

        var result = service.calculate(from, from.plusDays(7));

        assertThat(result.getAvailability()).isEqualTo("UNKNOWN");
        assertThat(result.getPoints()).isEmpty();
    }

    @Test
    void calculatesDeterministicScenarioFromCurrentLoadAndPlannedTss() {
        LocalDate from = LocalDate.of(2026, 7, 20);
        PmcDataDto baseline = PmcDataDto.builder().date(from.minusDays(1))
                .ctl(BigDecimal.valueOf(40)).atl(BigDecimal.valueOf(50)).tsb(BigDecimal.valueOf(-10)).build();
        TrainingPlanDto plan = TrainingPlanDto.builder().date(from)
                .plannedTss(BigDecimal.valueOf(80)).build();
        when(analyticsService.getPmc(from.minusDays(1), from.minusDays(1))).thenReturn(List.of(baseline));
        when(trainingPlanService.getPlans(from, from.plusDays(1))).thenReturn(List.of(plan));

        var result = service.calculate(from, from.plusDays(1));

        assertThat(result.getAvailability()).isEqualTo("AVAILABLE");
        assertThat(result.getPoints()).hasSize(2);
        assertThat(result.getPoints().get(0).getPlannedTss()).isEqualByComparingTo("80");
        assertThat(result.getAssumptions()).anyMatch(value -> value.contains("nie prognoza"));
    }
}
