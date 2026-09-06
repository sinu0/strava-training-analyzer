package pl.strava.analizator.application;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.model.AthleteSnapshot;
import pl.strava.analizator.domain.model.TrainingPlan;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.port.CoachingFeedbackRepository;

@Service @RequiredArgsConstructor
public class AthleteSnapshotService {
    private final Clock clock;
    private final TrainingPreferencesService preferences;
    private final TrainingLoadService trainingLoad;
    private final HealthService health;
    private final AthleteProfileRepository profiles;
    private final TrainingPlanRepository plans;
    private final CoachingFeedbackRepository feedback;
    private final pl.strava.analizator.domain.port.ActivityRepository activities;

    public AthleteSnapshot today() {
        LocalDate date = LocalDate.now(clock);
        var settings = preferences.get();
        var profile = profiles.findFirst().orElse(null);
        var load = trainingLoad.getLoad(date.minusDays(41), date);
        var latest = load.getPoints().stream().filter(TrainingLoadService::complete).reduce((a,b) -> b).orElse(null);
        var recovery = health.getRecoveryStatus(date);
        List<TrainingPlan> todayPlans = plans.findByDateRange(date, date);
        var planned = todayPlans.stream().filter(p -> p.getActualActivityId() == null
                        && (p.getStatus() == TrainingPlanStatus.PLANNED || p.getStatus() == TrainingPlanStatus.PARTIAL))
                .findFirst().orElse(null);
        var recent = feedback.findBetween(date.minusDays(14).atStartOfDay(clock.getZone()).toInstant(), clock.instant());
        var completedActivities = activities.findByStartedAtBetween(date.atStartOfDay(clock.getZone()).toOffsetDateTime(), java.time.OffsetDateTime.now(clock));
        Integer available = settings.getAvailableMinutes().get(date.getDayOfWeek().name());
        if (available != null) available = Math.max(0, available - completedActivities.stream()
                .map(a -> a.getMovingTimeSec()).filter(Objects::nonNull).mapToInt(Integer::intValue).sum() / 60);
        var rpe = recent.stream().map(f -> f.getRpe()).filter(Objects::nonNull).mapToInt(Integer::intValue).average();
        List<String> gaps = new ArrayList<>();
        if (latest == null || latest.getDate().isBefore(date.minusDays(1))) gaps.add("Brak aktualnego obciążenia; sprawdź synchronizację i przeliczenia.");
        if (!"AVAILABLE".equals(load.getAvailability())) gaps.add("Niepełne pokrycie historii obciążenia.");
        if (recovery == null || !"AVAILABLE".equals(recovery.availability())) gaps.add("Brak pełnych danych regeneracji.");
        if (profile == null || !profile.hasFtp()) gaps.add("Brak potwierdzonego FTP w profilu.");
        if (settings.getGoalType() == null) gaps.add("Cel treningowy nie został ustawiony.");
        boolean blocked = settings.getConstraints().stream().anyMatch(c -> !date.isBefore(c.getFrom()) && !date.isAfter(c.getTo()) && "BLOCKED".equals(c.getType()));
        boolean returning = settings.getConstraints().stream().anyMatch(c -> !date.isBefore(c.getFrom()) && !date.isAfter(c.getTo()) && "RETURN_TO_TRAINING".equals(c.getType()));
        return AthleteSnapshot.builder().date(date).timezone(clock.getZone().getId())
                .ftpWatts(profile != null && profile.hasFtp() ? profile.getFtpWatts().intValue() : null)
                .availableMinutes(available).environment(settings.getEnvironment())
                .ctl(latest != null ? latest.getCtl().doubleValue() : null).atl(latest != null ? latest.getAtl().doubleValue() : null)
                .form(latest != null ? latest.getTsb().doubleValue() : null).loadAsOf(load.getAsOf())
                .recoveryScore(recovery != null && "AVAILABLE".equals(recovery.availability()) ? recovery.score() : null)
                .goalType(settings.getGoalType()).goalTarget(settings.getTargetValue()).goalDeadline(settings.getDeadline())
                .plannedWorkoutId(planned != null ? planned.getId() : null).plannedType(planned != null ? planned.getPlannedType() : null)
                .plannedDurationMinutes(planned != null ? planned.getPlannedDurationMin() : null)
                .plannedTss(planned != null && planned.getPlannedTss() != null ? planned.getPlannedTss().doubleValue() : null)
                .blocked(blocked).returnToTraining(returning).alreadyCompletedToday(!completedActivities.isEmpty() || todayPlans.stream().anyMatch(p -> p.getActualActivityId() != null || p.getStatus() == TrainingPlanStatus.COMPLETED))
                .recentAverageRpe(rpe.isPresent() ? rpe.getAsDouble() : null).feedbackCount(recent.size()).dataGaps(List.copyOf(gaps)).build();
    }
}
