package pl.strava.analizator.domain.model;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class TrainingDayEnvironment {
    private final LocalDate date;
    private final String locationName;
    private final int outdoorScore;
    private final int bestWindowScore;
    private final String weatherDescription;
}
