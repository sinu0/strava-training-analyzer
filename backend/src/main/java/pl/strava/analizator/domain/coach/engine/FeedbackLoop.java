package pl.strava.analizator.domain.coach.engine;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import pl.strava.analizator.domain.coach.model.PostSessionFeedback;

public class FeedbackLoop {

    private final Map<String, SessionResponseProfile> profiles = new HashMap<>();

    public void process(PostSessionFeedback feedback) {
        String type = feedback.getPlannedType() != null
                ? feedback.getPlannedType().toUpperCase(Locale.ROOT) : "GENERIC";

        SessionResponseProfile profile = profiles.computeIfAbsent(type, k -> new SessionResponseProfile());

        profile.totalSessions++;
        if (feedback.isCompleted()) {
            profile.completedSessions++;
        }
        profile.totalRpe += feedback.getRpe();
        profile.totalQuality += feedback.getExecutionQuality();

        if (feedback.getActualTss() > 0 && feedback.getActualDurationMinutes() > 0) {
            double efficiency = feedback.getActualTss() / feedback.getActualDurationMinutes();
            profile.totalEfficiency += efficiency;
            profile.efficiencySamples++;
        }
    }

    public double getResponseFactor(String sessionType) {
        SessionResponseProfile profile = profiles.get(sessionType.toUpperCase(Locale.ROOT));
        if (profile == null || profile.totalSessions == 0) {
            return 1.0;
        }

        double completionRate = (double) profile.completedSessions / profile.totalSessions;
        double avgQuality = profile.totalSessions > 0
                ? profile.totalQuality / profile.totalSessions : 0.7;

        return (completionRate * 0.6 + avgQuality * 0.4);
    }

    public double getAverageRpe(String sessionType) {
        SessionResponseProfile profile = profiles.get(sessionType.toUpperCase(Locale.ROOT));
        if (profile == null || profile.totalSessions == 0) return 5.0;
        return (double) profile.totalRpe / profile.totalSessions;
    }

    public double getAverageEfficiency(String sessionType) {
        SessionResponseProfile profile = profiles.get(sessionType.toUpperCase(Locale.ROOT));
        if (profile == null || profile.efficiencySamples == 0) return 1.0;
        return profile.totalEfficiency / profile.efficiencySamples;
    }

    private static class SessionResponseProfile {
        int totalSessions;
        int completedSessions;
        double totalRpe;
        double totalQuality;
        double totalEfficiency;
        int efficiencySamples;
    }
}
