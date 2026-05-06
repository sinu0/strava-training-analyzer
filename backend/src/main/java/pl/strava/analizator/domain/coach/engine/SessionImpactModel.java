package pl.strava.analizator.domain.coach.engine;

import java.util.LinkedHashMap;
import java.util.Map;

import pl.strava.analizator.domain.coach.model.AdaptationDecomposition;
import pl.strava.analizator.domain.coach.model.GoalType;
import pl.strava.analizator.domain.coach.model.SessionImpactResult;
import pl.strava.analizator.domain.coach.model.TrajectoryPhase;

public class SessionImpactModel {

    public SessionImpactResult compute(String sessionType, GoalType goalType, TrajectoryPhase phase,
                                        AdaptationDecomposition decomposition) {
        double baseGain = getBaseGoalGain(sessionType, goalType);
        double phaseMultiplier = getPhaseMultiplier(sessionType, phase);
        double decompositionMultiplier = computeDecompositionMultiplier(sessionType, decomposition);

        double goalProgressGain = baseGain * phaseMultiplier * decompositionMultiplier;
        goalProgressGain = Math.min(100.0, goalProgressGain);

        Map<String, Double> contributions = new LinkedHashMap<>();
        contributions.put("base_gain", baseGain);
        contributions.put("phase_multiplier", phaseMultiplier);
        contributions.put("decomposition_multiplier", decompositionMultiplier);
        contributions.put("total", goalProgressGain);

        return SessionImpactResult.builder()
                .sessionType(sessionType)
                .goalProgressGain(goalProgressGain)
                .fatigueCost(0)
                .riskPenalty(0)
                .netScore(0)
                .componentContributions(contributions)
                .build();
    }

    private double getBaseGoalGain(String sessionType, GoalType goalType) {
        return switch (goalType) {
            case FTP -> switch (sessionType.toUpperCase()) {
                case "SWEET_SPOT" -> 85;
                case "THRESHOLD" -> 95;
                case "VO2MAX" -> 70;
                case "ENDURANCE" -> 45;
                case "TEMPO" -> 60;
                case "RECOVERY" -> 15;
                case "ANAEROBIC" -> 45;
                default -> 30;
            };
            case VO2MAX -> switch (sessionType.toUpperCase()) {
                case "VO2MAX" -> 95;
                case "ANAEROBIC" -> 75;
                case "THRESHOLD" -> 65;
                case "SWEET_SPOT" -> 50;
                case "ENDURANCE" -> 30;
                case "TEMPO" -> 40;
                case "RECOVERY" -> 10;
                default -> 25;
            };
            case DISTANCE -> switch (sessionType.toUpperCase()) {
                case "ENDURANCE" -> 90;
                case "TEMPO" -> 70;
                case "SWEET_SPOT" -> 40;
                case "THRESHOLD" -> 30;
                case "RECOVERY" -> 10;
                default -> 25;
            };
            case DURABILITY -> switch (sessionType.toUpperCase()) {
                case "ENDURANCE" -> 85;
                case "TEMPO" -> 80;
                case "SWEET_SPOT" -> 75;
                case "THRESHOLD" -> 60;
                case "RECOVERY" -> 12;
                default -> 30;
            };
            case POWER_DURATION, TIME_ON_SEGMENT -> switch (sessionType.toUpperCase()) {
                case "VO2MAX" -> 90;
                case "THRESHOLD" -> 80;
                case "ANAEROBIC" -> 65;
                case "SWEET_SPOT" -> 55;
                case "ENDURANCE" -> 30;
                case "RECOVERY" -> 10;
                default -> 25;
            };
            case POWER_TO_WEIGHT -> switch (sessionType.toUpperCase()) {
                case "VO2MAX" -> 85;
                case "THRESHOLD" -> 80;
                case "SWEET_SPOT" -> 60;
                case "ENDURANCE" -> 40;
                case "TEMPO" -> 50;
                case "RECOVERY" -> 10;
                default -> 30;
            };
        };
    }

    private double getPhaseMultiplier(String sessionType, TrajectoryPhase phase) {
        boolean isIntensity = "VO2MAX".equalsIgnoreCase(sessionType)
                || "THRESHOLD".equalsIgnoreCase(sessionType)
                || "ANAEROBIC".equalsIgnoreCase(sessionType)
                || "SWEET_SPOT".equalsIgnoreCase(sessionType);

        boolean isEndurance = "ENDURANCE".equalsIgnoreCase(sessionType)
                || "TEMPO".equalsIgnoreCase(sessionType);

        return switch (phase) {
            case BASE -> isEndurance ? 1.3 : isIntensity ? 0.7 : 1.0;
            case BUILD -> 1.0;
            case PEAK -> isIntensity ? 1.4 : isEndurance ? 0.6 : 1.0;
        };
    }

    private double computeDecompositionMultiplier(String sessionType,
                                                   AdaptationDecomposition decomposition) {
        if (decomposition == null || decomposition.getComponents() == null) {
            return 1.0;
        }

        String mappedComponent = mapSessionToComponent(sessionType.toUpperCase());
        if (mappedComponent == null) {
            return 1.0;
        }

        for (var component : decomposition.getComponents()) {
            if (component.getName().equalsIgnoreCase(mappedComponent)) {
                double deficit = 1.0 - component.getCurrentLevel();
                return 1.0 + (deficit * component.getWeight() * 0.5);
            }
        }
        return 1.0;
    }

    private String mapSessionToComponent(String sessionType) {
        return switch (sessionType) {
            case "VO2MAX", "ANAEROBIC" -> "VO2";
            case "THRESHOLD", "SWEET_SPOT" -> "THRESHOLD";
            case "ENDURANCE", "TEMPO" -> "ENDURANCE";
            default -> null;
        };
    }
}
