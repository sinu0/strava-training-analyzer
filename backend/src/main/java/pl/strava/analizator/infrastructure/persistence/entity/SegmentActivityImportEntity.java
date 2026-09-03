package pl.strava.analizator.infrastructure.persistence.entity;

import java.time.Instant;
import java.util.UUID;

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
@Table(name = "segment_activity_imports")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SegmentActivityImportEntity {
    @Id @Column(name = "activity_id") private UUID activityId;
    private String capability;
    @Column(name = "effort_count") private int effortCount;
    @Column(name = "checked_at") private Instant checkedAt;
}
