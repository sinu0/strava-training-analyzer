package pl.strava.analizator.application;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

import org.springframework.stereotype.Service;

import pl.strava.analizator.application.dto.WeeklyBudgetDto;

/**
 * Computes optimal weekly training load based on CTL ramp rate limits
 * and event proximity.
 */
@Service
public class WeeklyBudgetService {

    private static final double TSS_PER_CTL_POINT = 7.0;

    public WeeklyBudgetDto getWeeklyBudget(double currentCtl, LocalDate eventDate) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);

        long daysToEvent = eventDate != null ? today.until(eventDate).getDays() : Long.MAX_VALUE;

        // Optimal TSS based on current CTL (weekly TSS ≈ CTL × 7)
        double optimalWeeklyTss = currentCtl * TSS_PER_CTL_POINT;

        // Reduce if close to event (taper)
        if (daysToEvent <= 7) {
            optimalWeeklyTss *= 0.5;
        } else if (daysToEvent <= 14) {
            optimalWeeklyTss *= 0.75;
        }

        // Completed TSS is estimated — actual values need activity metric queries
        // For now, provide the target budget
        double completedTss = 0;

        double remainingTss = Math.max(0, optimalWeeklyTss - completedTss);

        String status;
        if (remainingTss < 0) status = "OVER";
        else if (remainingTss < optimalWeeklyTss * 0.1) status = "OPTIMAL";
        else if (remainingTss < optimalWeeklyTss * 0.4) status = "UNDER";
        else status = "LOW";

        return WeeklyBudgetDto.builder()
                .optimalTss(Math.round(optimalWeeklyTss))
                .completedTss(Math.round(completedTss))
                .remainingTss(Math.round(remainingTss))
                .percentComplete(optimalWeeklyTss > 0
                        ? Math.round((completedTss / optimalWeeklyTss) * 100) : 0)
                .status(status)
                .weekStart(weekStart.toString())
                .weekEnd(weekEnd.toString())
                .build();
    }
}
