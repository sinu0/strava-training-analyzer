package pl.strava.analizator.application.dto;

import java.time.LocalDate;

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
public class PowerAnalyticsDto {
    private LocalDate from;
    private LocalDate to;
    private String availability;
    private PowerCurveDto curve;
    private FtpProgressDto ftp;
    private DurabilityInsightDto durability;
}
