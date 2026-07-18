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
public class AnalyticsOverviewDto {
    private LocalDate from;
    private LocalDate to;
    private String availability;
    private FtpProgressDto ftp;
    private List<WeeklySummaryDto> weeks;
}
