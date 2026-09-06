package pl.strava.analizator.application;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Objects;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.WeeklyReviewDto;
import pl.strava.analizator.domain.model.TrainingDecisionEngine;
import pl.strava.analizator.domain.model.TrainingPlanStatus;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.TrainingPlanRepository;
import pl.strava.analizator.domain.port.CoachingFeedbackRepository;

@Service @RequiredArgsConstructor
public class WeeklyReviewService {
    private final Clock clock;
    private final TrainingPlanRepository plans;
    private final ActivityRepository activities;
    private final CoachingFeedbackRepository feedback;

    public WeeklyReviewDto review(LocalDate from) {
        LocalDate to = from.plusDays(6);
        if (from.isAfter(LocalDate.now(clock))) throw new IllegalArgumentException("Review wymaga rozpoczętego tygodnia");
        var scheduled = plans.findByDateRange(from, to);
        var start = from.atStartOfDay(clock.getZone()).toOffsetDateTime();
        var end = to.plusDays(1).atStartOfDay(clock.getZone()).toOffsetDateTime();
        var rides = activities.findByStartedAtBetween(start, end);
        var responses = feedback.findBetween(start.toInstant(), end.toInstant().isAfter(clock.instant()) ? clock.instant() : end.toInstant());
        int completed = (int) scheduled.stream().filter(p -> p.getActualActivityId() != null || p.getStatus() == TrainingPlanStatus.COMPLETED).count();
        var rpe = responses.stream().map(r -> r.getRpe()).filter(Objects::nonNull).mapToInt(Integer::intValue).average();
        var reasons = new ArrayList<String>();
        if (scheduled.isEmpty()) reasons.add("Brak planu: nie oceniono zgodności wykonania.");
        if (rpe.isEmpty()) reasons.add("Brak odczuć po treningach: reakcja na obciążenie jest nieznana.");
        boolean plannedDurationKnown = scheduled.stream().allMatch(p -> p.getPlannedDurationMin() != null);
        boolean actualDurationKnown = rides.stream().allMatch(a -> a.getMovingTimeSec() != null);
        if (!plannedDurationKnown || !actualDurationKnown) reasons.add("Brak czasu części sesji: nie podano pozornej sumy minut.");
        if (!to.isBefore(LocalDate.now(clock))) reasons.add("Tydzień jest w toku; nie oceniono jeszcze niewykonanych sesji.");
        String advice = rpe.isPresent() && rpe.getAsDouble() >= 8
                ? "Zgłoszony wysiłek był wysoki. Przy następnym treningu ogranicz intensywność i sprawdź regenerację."
                : "Utrzymaj zaplanowaną dostępność; nie nadrabiaj opuszczonych sesji przez kumulowanie obciążenia.";
        return WeeklyReviewDto.builder().from(from).to(to).plannedSessions(scheduled.size()).completedSessions(completed)
                .activityCount(rides.size()).plannedMinutes(plannedDurationKnown ? scheduled.stream().mapToInt(p -> p.getPlannedDurationMin()).sum() : null)
                .actualMinutes(actualDurationKnown ? rides.stream().mapToInt(a -> a.getMovingTimeSec()).sum()/60 : null)
                .completionRatio(scheduled.isEmpty() ? null : completed/(double)scheduled.size())
                .averageRpe(rpe.isPresent() ? rpe.getAsDouble() : null).feedbackCount((int)responses.stream().filter(r -> r.getRpe() != null).count())
                .availability(reasons.isEmpty() ? "AVAILABLE" : "PARTIAL").algorithmVersion(TrainingDecisionEngine.VERSION)
                .recommendation(advice).reasons(reasons).build();
    }
}
