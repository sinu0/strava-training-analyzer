package pl.strava.analizator.domain.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/** Deterministic policy; it never fills missing measurements with population averages. */
public class TrainingDecisionEngine {
    public static final String VERSION = "coaching-policy-1";
    private static final Set<String> HARD = Set.of("TEMPO", "SWEET_SPOT", "THRESHOLD", "VO2MAX", "ANAEROBIC", "SPRINT");

    public TrainingDecision decide(AthleteSnapshot s) {
        List<String> reasons = new ArrayList<>(s.getDataGaps());
        if (s.getGoalType() != null) reasons.add("Cel treningowy: " + s.getGoalType() + (s.getGoalDeadline() != null ? ", termin " + s.getGoalDeadline() : "") + ".");
        if (s.getEnvironment() != null) reasons.add("Preferowane środowisko: " + s.getEnvironment() + ".");
        var result = TrainingDecision.builder().asOf(s.getDate()).plannedWorkoutId(s.getPlannedWorkoutId());
        if (s.isBlocked() || Integer.valueOf(0).equals(s.getAvailableMinutes())) {
            reasons.add("Dzień wyłączony z treningu w Twoim kalendarzu.");
            return result.decision("REST").confidence("HIGH").description("Odpoczynek zgodnie z dostępnością i ograniczeniami.").reasons(reasons).build();
        }
        if (s.isAlreadyCompletedToday() && s.getPlannedWorkoutId() == null) {
            reasons.add("Dzisiejszy trening jest już zapisany; brak kolejnej zaplanowanej sesji.");
            return result.decision("REST").confidence("MEDIUM").description("Trening wykonany. Uzupełnij odczucia i regenerację.").reasons(reasons).build();
        }
        if (s.getAvailableMinutes() == null) {
            reasons.add("Ustaw dostępny czas w kontekście treningowym.");
            return result.decision("NEEDS_INPUT").confidence("LOW").description("Brakuje informacji o dostępnym czasie.").reasons(reasons).build();
        }
        if (s.getRecoveryScore() != null && s.getRecoveryScore() < 35) {
            reasons.add("Aktualny check-in wskazuje niską regenerację.");
            return result.decision("REST").confidence("MEDIUM").description("Odpoczynek; ponownie oceń samopoczucie przed treningiem.").reasons(reasons).build();
        }
        boolean limited = !s.getDataGaps().isEmpty() || s.isReturnToTraining()
                || (s.getRecentAverageRpe() != null && s.getRecentAverageRpe() >= 8)
                || (s.getForm() != null && s.getForm() < -20);
        String type = s.getPlannedType() != null ? s.getPlannedType() : "ENDURANCE";
        int duration = Math.min(s.getAvailableMinutes(), s.getPlannedDurationMinutes() != null
                ? s.getPlannedDurationMinutes() : s.getAvailableMinutes());
        if (limited) {
            type = "ENDURANCE";
            duration = Math.min(duration, 45);
            reasons.add("Ograniczono sesję do spokojnego wysiłku z powodu niepełnych danych, obciążenia lub ograniczeń.");
        }
        if (duration < 15) {
            reasons.add("Dostępny czas jest krótszy niż 15 minut.");
            return result.decision("REST").confidence("MEDIUM").description("Odpoczynek lub krótka aktywność według samopoczucia.").reasons(reasons).build();
        }
        if (HARD.contains(type) && s.getFtpWatts() == null) { type = "ENDURANCE"; limited = true; }
        Double tss = !limited && s.getPlannedTss() != null && s.getPlannedDurationMinutes() != null
                && s.getPlannedDurationMinutes() == duration ? s.getPlannedTss() : null;
        reasons.add(s.getPlannedWorkoutId() != null ? "Uwzględniono dzisiejszy plan i jego niezmienny snapshot." : "Brak zaplanowanej sesji: spokojny trening w dostępnym czasie.");
        return result.decision("TRAIN").sessionType(type).durationMinutes(duration).targetTss(tss)
                .confidence(limited ? "LOW" : "MEDIUM")
                .description(limited ? "Spokojny wysiłek w tempie rozmowy, jeśli samopoczucie na to pozwala. Przerwij przy pogorszeniu samopoczucia."
                        : "Wykonaj sesję zgodnie z planem i aktualnym samopoczuciem.")
                .reasons(List.copyOf(reasons)).build();
    }
}
