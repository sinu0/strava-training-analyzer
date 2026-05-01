package pl.strava.analizator.application.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyOptimizedPlanRequest {
    private String name;
    private String goalPriority;
    private double targetWeeklyTss;
    private List<SessionInputDto> sessions;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionInputDto {
        private java.time.LocalDate day;
        private String type;
        private int durationMinutes;
        private java.math.BigDecimal tss;
        private String goal;
    }
}
