package pl.strava.analizator.domain.vo;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Immutable date range.
 */
@Getter
@AllArgsConstructor
public class DateRange {

    private final LocalDate from;
    private final LocalDate to;

    public static DateRange lastDays(int days) {
        LocalDate now = LocalDate.now();
        return new DateRange(now.minusDays(days), now);
    }

    public static DateRange of(LocalDate from, LocalDate to) {
        return new DateRange(from, to);
    }

    public long dayCount() {
        return java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
    }
}
