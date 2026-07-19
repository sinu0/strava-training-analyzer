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
@Table(name = "ui_preferences")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UiPreferencesEntity {
    @Id
    private Short id;

    @Column(name = "schema_version", nullable = false)
    private int schemaVersion;

    @Column(nullable = false)
    private long revision;

    @Column(name = "dashboard_json", nullable = false, columnDefinition = "jsonb")
    private String dashboardJson;

    @Column(name = "mobile_navigation_json", nullable = false, columnDefinition = "jsonb")
    private String mobileNavigationJson;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
