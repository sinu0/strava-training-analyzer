package pl.strava.analizator.application;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.BlockHealthDto;
import pl.strava.analizator.application.dto.CalendarDayDto;
import pl.strava.analizator.application.dto.ProgressionLevelDto;
import pl.strava.analizator.application.dto.ReadinessDto;
import pl.strava.analizator.application.dto.TrainingGoalScorecardDto;
import pl.strava.analizator.application.dto.TrainingPlanProgramDto;
import pl.strava.analizator.application.dto.TrainingWeekObjectiveDto;

import java.time.LocalDate;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class BlockHealthService {

    private static final List<String> MISSED_OUTCOMES = List.of("MISSED_STIMULUS", "TOO_EASY");
    private static final List<String> OVERLOAD_OUTCOMES = List.of("TOO_HARD", "OVERREACHED");

    private final TrainingPlanService trainingPlanService;
    private final AnalyticsService analyticsService;

    public BlockHealthDto getCurrentBlockHealth() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        TrainingPlanProgramDto currentProgram = trainingPlanService.getPrograms().stream()
                .filter(program -> !today.isBefore(program.getStartDate()) && !today.isAfter(program.getEndDate()))
                .findFirst()
                .orElse(null);

        if (currentProgram == null) {
            return BlockHealthDto.builder()
                    .status("NO_ACTIVE_BLOCK")
                    .label("Brak aktywnego bloku")
                    .description("Wygeneruj program, żeby ocenić jakość bieżącego bloku i ryzyka stagnacji.")
                    .keySignals(List.of("Brak aktywnego programu treningowego."))
                    .nextFocus("Najpierw ustaw blok lub tydzień docelowy.")
                    .build();
        }

        TrainingWeekObjectiveDto currentObjective = currentProgram.getWeeklyObjectives().stream()
                .filter(objective -> !today.isBefore(objective.getWeekStart()) && !today.isAfter(objective.getWeekEnd()))
                .findFirst()
                .orElseGet(() -> currentProgram.getWeeklyObjectives().isEmpty()
                        ? null
                        : currentProgram.getWeeklyObjectives().getLast());

        TrainingGoalScorecardDto currentScorecard = currentProgram.getGoalScorecards().stream()
                .filter(scorecard -> !today.isBefore(scorecard.getWeekStart()) && !today.isAfter(scorecard.getWeekEnd()))
                .findFirst()
                .orElseGet(() -> currentProgram.getGoalScorecards().isEmpty()
                        ? null
                        : currentProgram.getGoalScorecards().getLast());

        List<CalendarDayDto> recentDays = trainingPlanService.getCalendarView(today.minusDays(13), today);
        List<ProgressionLevelDto> progressionLevels = analyticsService.getProgressionLevels();
        ReadinessDto readiness = analyticsService.getReadiness();

        int adjustmentDays = (int) recentDays.stream()
                .filter(day -> day.getAdjustment() != null)
                .count();
        int missedStimulusDays = (int) recentDays.stream()
                .filter(day -> day.getExecution() != null && MISSED_OUTCOMES.contains(day.getExecution().getOutcome()))
                .count();
        int overloadDays = (int) recentDays.stream()
                .filter(day -> day.getExecution() != null && OVERLOAD_OUTCOMES.contains(day.getExecution().getOutcome()))
                .count();
        long slippingSystems = progressionLevels.stream()
                .filter(this::isSlippingSystem)
                .count();

        String goalExecutionStatus = currentScorecard != null ? currentScorecard.getGoalExecutionStatus() : "STABLE";
        String status = determineStatus(goalExecutionStatus, adjustmentDays, missedStimulusDays, overloadDays, slippingSystems,
                readiness != null ? readiness.getScore() : null);

        return BlockHealthDto.builder()
                .status(status)
                .label(labelFor(status))
                .description(descriptionFor(status))
                .objectiveLabel(currentObjective != null ? currentObjective.getLabel() : null)
                .programGoal(currentProgram.getGoal())
                .goalExecutionStatus(goalExecutionStatus)
                .goalExecutionScore(currentScorecard != null ? currentScorecard.getGoalExecutionScore() : null)
                .adjustmentDays(adjustmentDays)
                .missedStimulusDays(missedStimulusDays)
                .overloadDays(overloadDays)
                .keySignals(buildSignals(currentScorecard, adjustmentDays, missedStimulusDays, overloadDays, slippingSystems))
                .nextFocus(nextFocus(currentObjective, currentScorecard, progressionLevels))
                .build();
    }

    private String determineStatus(
            String goalExecutionStatus,
            int adjustmentDays,
            int missedStimulusDays,
            int overloadDays,
            long slippingSystems,
            Integer readinessScore) {
        if (adjustmentDays >= 3 && ("MISSED".equals(goalExecutionStatus) || missedStimulusDays >= 2)) {
            return "CHAOTIC_BLOCK";
        }
        if (overloadDays >= 2 && slippingSystems > 0 && readinessScore != null && readinessScore < 55) {
            return "FATIGUE_WITHOUT_PROGRESS";
        }
        if (adjustmentDays >= 3) {
            return "OVER_ADJUSTED";
        }
        if ("MISSED".equals(goalExecutionStatus) || "PARTIAL".equals(goalExecutionStatus) || missedStimulusDays >= 2) {
            return "MISSED_KEY_STIMULUS";
        }
        return "STABLE_PRODUCTIVE";
    }

    private List<String> buildSignals(
            TrainingGoalScorecardDto currentScorecard,
            int adjustmentDays,
            int missedStimulusDays,
            int overloadDays,
            long slippingSystems) {
        List<String> signals = new ArrayList<>();
        if (currentScorecard != null && currentScorecard.getPlannedGoalSessions() > 0) {
            signals.add("Bodziec celu: %d/%d".formatted(
                    currentScorecard.getCompletedGoalSessions(),
                    currentScorecard.getPlannedGoalSessions()));
        }
        if (adjustmentDays > 0) {
            signals.add("Korekty w 14 dniach: " + adjustmentDays);
        }
        if (missedStimulusDays > 0) {
            signals.add("Nietrafione bodźce: " + missedStimulusDays);
        }
        if (overloadDays > 0) {
            signals.add("Za ciężkie sesje: " + overloadDays);
        }
        if (slippingSystems > 0) {
            signals.add("Systemy bez progresu: " + slippingSystems);
        }
        return signals.isEmpty() ? List.of("Blok jest stabilny i nie pokazuje dużych czerwonych flag.") : signals;
    }

    private String nextFocus(
            TrainingWeekObjectiveDto currentObjective,
            TrainingGoalScorecardDto currentScorecard,
            List<ProgressionLevelDto> progressionLevels) {
        if (currentScorecard != null && currentScorecard.getGoalFocusLabel() != null) {
            return "Obroń fokus: " + currentScorecard.getGoalFocusLabel().toLowerCase() + ".";
        }
        if (currentObjective != null && currentObjective.getFocus() != null) {
            return currentObjective.getFocus();
        }
        return progressionLevels.stream()
                .filter(this::isSlippingSystem)
                .sorted(Comparator.comparing(ProgressionLevelDto::getLabel))
                .map(ProgressionLevelDto::getNextRecommendation)
                .findFirst()
                .orElse("Trzymaj główny bodziec tygodnia bez dokładania chaosu.");
    }

    private boolean isSlippingSystem(ProgressionLevelDto level) {
        if ("DOWN".equals(level.getTrend())) {
            return true;
        }
        return level.getCurrentLoad() != null
                && level.getTargetLoad() != null
                && level.getCurrentLoad().compareTo(level.getTargetLoad()) < 0;
    }

    private String labelFor(String status) {
        return switch (status) {
            case "CHAOTIC_BLOCK" -> "Blok zaczyna się rozjeżdżać";
            case "FATIGUE_WITHOUT_PROGRESS" -> "Zmęczenie bez zysku";
            case "OVER_ADJUSTED" -> "Za dużo korekt";
            case "MISSED_KEY_STIMULUS" -> "Brakuje kluczowego bodźca";
            case "NO_ACTIVE_BLOCK" -> "Brak aktywnego bloku";
            default -> "Blok stabilny";
        };
    }

    private String descriptionFor(String status) {
        return switch (status) {
            case "CHAOTIC_BLOCK" -> "Za dużo korekt i za mało trafionych bodźców celu. Lepiej uprościć tydzień niż dokładać kolejne podmiany.";
            case "FATIGUE_WITHOUT_PROGRESS" -> "Koszt zmęczenia rośnie szybciej niż jakość bodźca. Potrzebujesz uspokoić blok i wrócić do kontrolowanego akcentu.";
            case "OVER_ADJUSTED" -> "Blok nadal żyje, ale zbyt często ratujesz tydzień podmianami. To sygnał, że struktura jest za mało odporna na realny dzień.";
            case "MISSED_KEY_STIMULUS" -> "Tydzień jeszcze nie dowozi głównego bodźca celu. Najpierw obroń kluczową sesję, dopiero potem myśl o dodatkach.";
            case "NO_ACTIVE_BLOCK" -> "Brak aktywnego planu oznacza brak sensownej oceny jakości bloku.";
            default -> "Blok wspiera cel, a korekty i zmęczenie są pod kontrolą.";
        };
    }
}
