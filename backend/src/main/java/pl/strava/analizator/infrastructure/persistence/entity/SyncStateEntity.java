package pl.strava.analizator.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.*;

@Entity
@Table(name = "sync_state")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncStateEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String status;
    private Instant lastSyncAt;
    private int importedTotal;
    private int skippedTotal;
    private Instant rateLimitResetsAt;
    private Instant updatedAt;
}
