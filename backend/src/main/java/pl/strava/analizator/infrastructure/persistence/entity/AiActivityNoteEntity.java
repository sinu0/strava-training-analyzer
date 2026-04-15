package pl.strava.analizator.infrastructure.persistence.entity;

import java.time.Instant;
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
@Table(name = "ai_activity_notes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiActivityNoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "activity_id", nullable = false, unique = true)
    private UUID activityId;

    @Column(name = "summary", columnDefinition = "TEXT", nullable = false)
    private String summary;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @Column(name = "model_id", nullable = false, length = 100)
    private String modelId;

    @Column(name = "provider_name", nullable = false, length = 50)
    private String providerName;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;
}
