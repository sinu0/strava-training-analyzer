package pl.strava.analizator.infrastructure.persistence.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ai_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSettingsEntity {
    @Id
    private Short id;

    @Column(nullable = false, length = 8)
    private String language;

    @Column(name = "coaching_style", nullable = false, length = 32)
    private String coachingStyle;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
