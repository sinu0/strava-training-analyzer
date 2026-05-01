package pl.strava.analizator.application.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentPerformanceStateDto {
    private BigDecimal ctl;
    private BigDecimal atl;
    private BigDecimal tsb;
    private String ctlTrend;
    private String fatigueTrend;
    private BigDecimal ftp;
    private String ftpTrend;
    private String hrvTrend;
    private String restingHrTrend;
    private String sleepQuality;
    private int recentSuccessCount;
    private int recentTotalCount;
}
