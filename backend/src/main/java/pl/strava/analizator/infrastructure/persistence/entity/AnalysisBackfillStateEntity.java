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
@Table(name = "analysis_backfill_state")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AnalysisBackfillStateEntity {
    @Id @Column(name = "job_type") private String jobType;
    private String status;
    private int processed;
    private int total;
    private String capability;
    @Column(name = "rate_limit_resets_at") private Instant rateLimitResetsAt;
    @Column(name = "error_message", columnDefinition = "TEXT") private String errorMessage;
    @Column(name = "started_at") private Instant startedAt;
    @Column(name = "updated_at") private Instant updatedAt;
    @Column(name = "completed_at") private Instant completedAt;
}
