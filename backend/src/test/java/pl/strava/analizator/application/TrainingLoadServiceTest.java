package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.port.DailyMetricRepository;

@ExtendWith(MockitoExtension.class)
class TrainingLoadServiceTest {
    @Mock private DailyMetricRepository repository;

    @Test
    void absentDaysAreGapsAndNeverCauseAFakeCollapseOrFullAvailability() {
        LocalDate from = LocalDate.of(2026, 9, 3);
        for (String name : new String[]{"ctl", "atl", "tsb"}) {
            when(repository.findNumericSeries(eq(name), any())).thenReturn(Map.of(from, BigDecimal.valueOf(40)));
        }
        when(repository.findNumericSeries(eq("training_load_coverage"), any()))
                .thenReturn(Map.of(from, BigDecimal.ONE));
        var result = new TrainingLoadService(repository).getLoad(from, from.plusDays(2));
        assertThat(result.getAvailability()).isEqualTo("PARTIAL");
        assertThat(result.getAsOf()).isEqualTo(from);
        assertThat(result.getTemporalCoverage()).isEqualByComparingTo("0.3333");
        assertThat(result.getPoints().get(1).getCtl()).isNull();
        assertThat(result.getPoints().get(1).getCtlDelta()).isNull();
        assertThat(result.getPoints().get(0).getCtlDelta()).isNull();
    }

    @Test
    void measuredZeroIsAvailableAndDiffersFromNoMeasurement() {
        LocalDate date = LocalDate.of(2026, 9, 3);
        for (String name : new String[]{"ctl", "atl", "tsb"}) {
            when(repository.findNumericSeries(eq(name), any())).thenReturn(Map.of(date, BigDecimal.ZERO));
        }
        when(repository.findNumericSeries(eq("training_load_coverage"), any()))
                .thenReturn(Map.of(date, BigDecimal.ONE));
        var result = new TrainingLoadService(repository).getLoad(date, date);
        assertThat(result.getAvailability()).isEqualTo("AVAILABLE");
        assertThat(result.getPoints().get(0).getCtl()).isZero();
    }
}
