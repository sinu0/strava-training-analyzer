package pl.strava.analizator.domain.model;

public final class TrainingSessionRoleResolver {

    private TrainingSessionRoleResolver() {
    }

    public static TrainingSessionRole fromPlan(TrainingPlan plan) {
        if (plan == null) {
            return TrainingSessionRole.ENDURANCE;
        }
        return fromPlanType(plan.getPlannedType(), plan.getPlannedDurationMin());
    }

    public static TrainingSessionRole fromPlanType(String plannedType, Integer plannedDurationMin) {
        if ("ENDURANCE".equals(plannedType) && plannedDurationMin != null && plannedDurationMin >= 120) {
            return TrainingSessionRole.LONG_ENDURANCE;
        }
        if (plannedType == null) {
            return TrainingSessionRole.ENDURANCE;
        }
        return switch (plannedType) {
            case "THRESHOLD", "SWEET_SPOT" -> TrainingSessionRole.THRESHOLD_QUALITY;
            case "VO2MAX", "ANAEROBIC" -> TrainingSessionRole.VO2_QUALITY;
            case "RECOVERY" -> TrainingSessionRole.RECOVERY;
            default -> TrainingSessionRole.ENDURANCE;
        };
    }

    public static TrainingSessionRole fromTemplate(WorkoutTemplate template) {
        if (template == null) {
            return TrainingSessionRole.ENDURANCE;
        }
        return fromCategory(template.getCategory(), template.getTargetDurationMin());
    }

    public static TrainingSessionRole fromCategory(WorkoutCategory category, Integer durationMin) {
        if (category == WorkoutCategory.ENDURANCE && durationMin != null && durationMin >= 120) {
            return TrainingSessionRole.LONG_ENDURANCE;
        }
        if (category == null) {
            return TrainingSessionRole.ENDURANCE;
        }
        return switch (category) {
            case THRESHOLD, SWEET_SPOT -> TrainingSessionRole.THRESHOLD_QUALITY;
            case VO2MAX, ANAEROBIC -> TrainingSessionRole.VO2_QUALITY;
            case RECOVERY -> TrainingSessionRole.RECOVERY;
            default -> TrainingSessionRole.ENDURANCE;
        };
    }

    public static boolean matchesAdaptiveRole(TrainingSessionRole role, WorkoutTemplate template) {
        return switch (role) {
            case LONG_ENDURANCE -> {
                TrainingSessionRole candidate = fromTemplate(template);
                yield candidate == TrainingSessionRole.LONG_ENDURANCE || candidate == TrainingSessionRole.ENDURANCE
                        || template.getCategory() == WorkoutCategory.SWEET_SPOT;
            }
            case THRESHOLD_QUALITY -> {
                TrainingSessionRole candidate = fromTemplate(template);
                yield candidate == TrainingSessionRole.THRESHOLD_QUALITY;
            }
            case VO2_QUALITY -> {
                TrainingSessionRole candidate = fromTemplate(template);
                yield candidate == TrainingSessionRole.VO2_QUALITY;
            }
            case RECOVERY -> {
                TrainingSessionRole candidate = fromTemplate(template);
                yield candidate == TrainingSessionRole.RECOVERY || candidate == TrainingSessionRole.ENDURANCE;
            }
            case ENDURANCE -> {
                TrainingSessionRole candidate = fromTemplate(template);
                yield candidate == TrainingSessionRole.ENDURANCE || candidate == TrainingSessionRole.LONG_ENDURANCE
                        || template.getCategory() == WorkoutCategory.TEMPO;
            }
        };
    }

    public static boolean matchesGoalFocus(TrainingSessionRole goalFocusRole, TrainingSessionRole sessionRole) {
        if (goalFocusRole == TrainingSessionRole.LONG_ENDURANCE) {
            return sessionRole == TrainingSessionRole.LONG_ENDURANCE || sessionRole == TrainingSessionRole.ENDURANCE;
        }
        return goalFocusRole == sessionRole;
    }

    public static TrainingSessionRole fromObjectiveType(String objectiveType) {
        if (objectiveType == null) {
            return TrainingSessionRole.ENDURANCE;
        }
        if (objectiveType.contains("VO2")) {
            return TrainingSessionRole.VO2_QUALITY;
        }
        if (objectiveType.contains("THRESHOLD") || objectiveType.contains("SHARPEN")) {
            return TrainingSessionRole.THRESHOLD_QUALITY;
        }
        if (objectiveType.contains("RECOVERY") || objectiveType.contains("TAPER")) {
            return TrainingSessionRole.RECOVERY;
        }
        return TrainingSessionRole.LONG_ENDURANCE;
    }
}
