package pl.strava.analizator.application;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.DailyDecisionDto;

/**
 * @deprecated Use {@link CoachService} directly. This service exists for backward
 * compatibility with the legacy {@code /api/daily-decision} endpoint.
 * Will be removed once the frontend is fully migrated to {@code /api/coach/today}.
 */
@Deprecated
@Service
@RequiredArgsConstructor
public class DailyDecisionService {

    private final CoachService coachService;

    public DailyDecisionDto getDailyDecision() {
        return coachService.getDailyDecisionCompat();
    }
}
