package pl.strava.analizator.domain.workout;

import java.util.List;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.WorkoutStep;

/** Time-weighted comparison against an immutable workout, with explicit sampling coverage. */
public class WorkoutComplianceEvaluator {
    public static final String VERSION = "workout-compliance-v2";

    public WorkoutCompliance evaluate(List<WorkoutStep> snapshot, Integer ftp, Activity activity) {
        if (activity == null || ftp == null || ftp <= 0 || snapshot == null || snapshot.isEmpty())
            return unknown("Brak historycznego snapshotu lub FTP.");
        if (!Boolean.TRUE.equals(activity.getDeviceWatts())) return unknown("Brak potwierdzenia pomiaru mocy z urządzenia.");
        int[] watts = activity.getPowerStream(), times = activity.getTimeStream();
        if (watts == null || times == null || times.length < 2 || watts.length != times.length)
            return unknown("Brak zgodnych strumieni czasu i mocy.");
        List<WorkoutStep> steps = WorkoutStepExpander.expand(snapshot);
        if (steps.stream().anyMatch(s -> s.getDurationSec() == null || s.getDurationSec() <= 0))
            return unknown("Otwarte kroki wymagają zapisanej osi czasu wykonania.");
        long expected = steps.stream().filter(s -> s.getPowerPctFtpLow() != null && s.getPowerPctFtpHigh() != null)
                .mapToLong(WorkoutStep::getDurationSec).sum();
        if (expected == 0) return unknown("Brak porównywalnych celów mocy.");
        long observed = 0, matched = 0;
        for (int i = 0; i + 1 < times.length; i++) {
            int start = times[i], end = times[i + 1];
            if (start < 0 || end <= start) return unknown("Strumień czasu nie jest rosnący.");
            // Long recording gaps must not be interpreted as a sustained sample.
            if (end - start > 10 || watts[i] < 0) continue;
            int cursor = 0;
            for (WorkoutStep step : steps) {
                int stepEnd = cursor + step.getDurationSec();
                int overlap = Math.max(0, Math.min(end, stepEnd) - Math.max(start, cursor));
                if (overlap > 0 && step.getPowerPctFtpLow() != null && step.getPowerPctFtpHigh() != null) {
                    observed += overlap;
                    if (watts[i] >= ftp * step.getPowerPctFtpLow() / 100.0 && watts[i] <= ftp * step.getPowerPctFtpHigh() / 100.0) matched += overlap;
                }
                cursor = stepEnd;
                if (cursor >= end) break;
            }
        }
        if (observed == 0) return unknown("Brak porównywalnego odcinka nagrania.");
        double coverage = Math.min(1, observed / (double) expected);
        return WorkoutCompliance.builder().availability(coverage >= 0.9 ? "AVAILABLE" : "PARTIAL")
                .score(coverage >= 0.9 ? (int)Math.round(matched * 100.0 / observed) : null)
                .coverage(coverage).reason(coverage >= 0.9 ? "Czas w celu mocy; pomiar urządzenia." : "Za małe pokrycie czasowe, aby ocenić wykonanie.").build();
    }

    public WorkoutCompliance unknown(String reason) {
        return WorkoutCompliance.builder().availability("UNKNOWN").reason(reason).build();
    }
}
