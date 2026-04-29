package pl.strava.analizator.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class TrainingSessionRoleResolverTest {

    @Test
    void fromPlan_returnsLongEnduranceForLongEnduranceRide() {
        TrainingPlan plan = TrainingPlan.builder()
                .id(UUID.randomUUID())
                .date(LocalDate.of(2025, 1, 6))
                .plannedType("ENDURANCE")
                .plannedDurationMin(150)
                .plannedTss(BigDecimal.valueOf(110))
                .status(TrainingPlanStatus.PLANNED)
                .createdAt(OffsetDateTime.now())
                .build();

        assertThat(TrainingSessionRoleResolver.fromPlan(plan)).isEqualTo(TrainingSessionRole.LONG_ENDURANCE);
    }

    @Test
    void fromTemplate_returnsThresholdQualityForSweetSpotTemplate() {
        WorkoutTemplate template = WorkoutTemplate.builder()
                .id(UUID.randomUUID())
                .name("Sweet Spot 3x12")
                .category(WorkoutCategory.SWEET_SPOT)
                .targetTss(BigDecimal.valueOf(82))
                .targetDurationMin(75)
                .relativeEffort(7)
                .intensityFactor(BigDecimal.valueOf(0.88))
                .steps(List.of())
                .createdBy("system")
                .createdAt(OffsetDateTime.now())
                .build();

        assertThat(TrainingSessionRoleResolver.fromTemplate(template)).isEqualTo(TrainingSessionRole.THRESHOLD_QUALITY);
    }

    @Test
    void matchesAdaptiveRole_acceptsEquivalentTemplateRole() {
        WorkoutTemplate sweetSpot = WorkoutTemplate.builder()
                .id(UUID.randomUUID())
                .name("Sweet Spot 2x20")
                .category(WorkoutCategory.SWEET_SPOT)
                .targetTss(BigDecimal.valueOf(78))
                .targetDurationMin(85)
                .relativeEffort(7)
                .intensityFactor(BigDecimal.valueOf(0.9))
                .steps(List.of())
                .createdBy("system")
                .createdAt(OffsetDateTime.now())
                .build();

        assertThat(TrainingSessionRoleResolver.matchesAdaptiveRole(TrainingSessionRole.THRESHOLD_QUALITY, sweetSpot)).isTrue();
        assertThat(TrainingSessionRoleResolver.matchesAdaptiveRole(TrainingSessionRole.VO2_QUALITY, sweetSpot)).isFalse();
    }

    @Test
    void matchesGoalFocus_treatsEnduranceAsSupportingLongEndurance() {
        assertThat(TrainingSessionRoleResolver.matchesGoalFocus(TrainingSessionRole.LONG_ENDURANCE, TrainingSessionRole.ENDURANCE))
                .isTrue();
        assertThat(TrainingSessionRoleResolver.matchesGoalFocus(TrainingSessionRole.THRESHOLD_QUALITY, TrainingSessionRole.ENDURANCE))
                .isFalse();
    }
}
