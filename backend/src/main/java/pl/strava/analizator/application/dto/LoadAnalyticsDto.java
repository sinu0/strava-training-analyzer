package pl.strava.analizator.application.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoadAnalyticsDto {
    private LocalDate from;
    private LocalDate to;
    private String availability;
    private List<PmcDataDto> points;
}
