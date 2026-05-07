package pl.strava.analizator.domain.port;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.vo.DateRange;

public interface DailySummaryRepository {

    DailySummary save(DailySummary summary);

    Optional<DailySummary> findByDate(LocalDate date);

    List<DailySummary> findByDateRange(DateRange range);

}
