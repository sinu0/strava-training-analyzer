package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratePlanRequest {
    private String goal;
    private String goalPriority;
    private LocalDate startDate;
    private LocalDate eventDate;
    private int weeks;
    private int trainingDaysPerWeek;
    private BigDecimal targetWeeklyTss;
    private Integer weekdayAvailabilityMinutes;
    private Integer weekendAvailabilityMinutes;
    private String preferredLongRideDay;
    private String environmentPreference;
}
