package pl.strava.analizator.infrastructure.persistence.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "training_adjustment_feedback")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingAdjustmentFeedbackEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "plan_id")
    private UUID planId;

    @Column(name = "suggestion_type", nullable = false, length = 40)
    private String suggestionType;

    @Column(name = "suggestion_title", length = 140)
    private String suggestionTitle;

    @Column(name = "feedback", nullable = false, length = 20)
    private String feedback;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
}
