package pl.strava.analizator.domain.workout;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.WorkoutStep;

/** Time-weighted comparison against an immutable workout, with explicit sampling coverage. */
public class WorkoutComplianceEvaluator {
    public static final String VERSION = "workout-compliance-v3";

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
        List<TargetWindow> windows = new ArrayList<>();
        long cursorMs = 0;
        for (WorkoutStep step : steps) {
            long endMs = cursorMs + step.getDurationSec() * 1_000L;
            if (step.getPowerPctFtpLow() != null && step.getPowerPctFtpHigh() != null) {
                windows.add(new TargetWindow(cursorMs, endMs,
                        step.getPowerPctFtpLow(), step.getPowerPctFtpHigh()));
            }
            cursorMs = endMs;
        }
        return evaluateWindows(windows, ftp, activity);
    }

    public WorkoutCompliance evaluate(WorkoutTimelineReconstructor.Timeline timeline, Integer ftp, Activity activity) {
        if (timeline == null || !"AVAILABLE".equals(timeline.availability())) {
            return unknown(timeline != null && timeline.reason() != null
                    ? timeline.reason() : "Brak odtworzonej osi czasu wykonania.");
        }
        if (activity == null || activity.getStartedAt() == null || ftp == null || ftp <= 0) {
            return unknown("Brak początku nagrania lub FTP.");
        }
        List<TargetWindow> windows = timeline.segments().stream()
                .filter(segment -> segment.powerPctFtpLow() != null && segment.powerPctFtpHigh() != null)
                .map(segment -> new TargetWindow(
                        Duration.between(activity.getStartedAt().toInstant(), segment.startedAt()).toMillis(),
                        Duration.between(activity.getStartedAt().toInstant(), segment.endedAt()).toMillis(),
                        segment.powerPctFtpLow(), segment.powerPctFtpHigh()))
                .toList();
        return evaluateWindows(windows, ftp, activity);
    }

    private WorkoutCompliance evaluateWindows(List<TargetWindow> windows, Integer ftp, Activity activity) {
        if (activity == null || ftp == null || ftp <= 0) return unknown("Brak aktywności lub FTP.");
        if (!Boolean.TRUE.equals(activity.getDeviceWatts())) return unknown("Brak potwierdzenia pomiaru mocy z urządzenia.");
        int[] watts = activity.getPowerStream(), times = activity.getTimeStream();
        if (watts == null || times == null || times.length < 2 || watts.length != times.length)
            return unknown("Brak zgodnych strumieni czasu i mocy.");
        long expected = windows.stream().mapToLong(window -> Math.max(0, window.endMs - window.startMs)).sum();
        if (expected == 0) return unknown("Brak porównywalnych celów mocy.");
        long observed = 0, matched = 0;
        for (int i = 0; i + 1 < times.length; i++) {
            long start = times[i] * 1_000L, end = times[i + 1] * 1_000L;
            if (start < 0 || end <= start) return unknown("Strumień czasu nie jest rosnący.");
            // Long recording gaps must not be interpreted as a sustained sample.
            if (end - start > 10_000 || watts[i] < 0) continue;
            for (TargetWindow window : windows) {
                long overlap = Math.max(0, Math.min(end, window.endMs) - Math.max(start, window.startMs));
                if (overlap > 0) {
                    observed += overlap;
                    if (watts[i] >= ftp * window.lowPct / 100.0
                            && watts[i] <= ftp * window.highPct / 100.0) matched += overlap;
                }
            }
        }
        if (observed == 0) return unknown("Brak porównywalnego odcinka nagrania.");
        double coverage = Math.min(1, observed / (double) expected);
        return WorkoutCompliance.builder().availability(coverage >= 0.9 ? "AVAILABLE" : "PARTIAL")
                .score(coverage >= 0.9 ? (int)Math.round(matched * 100.0 / observed) : null)
                .coverage(coverage).reason(coverage >= 0.9 ? "Czas w celu mocy; pomiar urządzenia." : "Za małe pokrycie czasowe, aby ocenić wykonanie.").build();
    }

    private record TargetWindow(long startMs, long endMs, int lowPct, int highPct) {
    }

    public WorkoutCompliance unknown(String reason) {
        return WorkoutCompliance.builder().availability("UNKNOWN").reason(reason).build();
    }
}
