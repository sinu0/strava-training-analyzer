package pl.strava.analizator.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CpModelDto {
    private double cp;
    private double wPrime;
    private double rSquared;
    private double cpPerKg;
    private int dataPoints;
    private int cpConfidence;
    private double currentFtp;
    private double ftpVsCpPct;
}
