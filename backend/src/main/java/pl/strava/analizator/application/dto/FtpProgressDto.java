package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
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
public class FtpProgressDto {

    private Short currentFtp;
    private String trend;          // "up", "down", "stagnant"
    private double changePercent;
    private List<FtpPoint> history;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FtpPoint {
        private String date;
        private BigDecimal value;
    }
}
