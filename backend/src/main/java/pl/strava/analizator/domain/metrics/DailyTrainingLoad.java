package pl.strava.analizator.domain.metrics;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class DailyTrainingLoad {
    private final LocalDate date;
    private final BigDecimal tss;
}
