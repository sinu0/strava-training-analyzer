package pl.strava.analizator.domain.model;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter @Builder(toBuilder = true)
public class AthleteSnapshot {
    private final LocalDate date;
    private final String timezone;
    private final Integer ftpWatts;
    private final Integer availableMinutes;
    private final String environment;
    private final Double ctl;
    private final Double atl;
    private final Double form;
    private final LocalDate loadAsOf;
    private final Integer recoveryScore;
    private final String goalType;
    private final Double goalTarget;
    private final LocalDate goalDeadline;
    private final UUID plannedWorkoutId;
    private final String plannedType;
    private final Integer plannedDurationMinutes;
    private final Double plannedTss;
    private final boolean blocked;
    private final boolean returnToTraining;
    private final boolean alreadyCompletedToday;
    private final Double recentAverageRpe;
    private final Integer feedbackCount;
    @Builder.Default private final List<String> dataGaps = List.of();
}
