package pl.strava.analizator.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "heatmap_segments")
@Getter @Setter @NoArgsConstructor
public class HeatmapSegmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lat1") private double lat1;
    @Column(name = "lon1") private double lon1;
    @Column(name = "lat2") private double lat2;
    @Column(name = "lon2") private double lon2;
    @Column(name = "grid_key_a") private String gridKeyA;
    @Column(name = "grid_key_b") private String gridKeyB;
    @Column(name = "traversal_count") private int traversalCount;
}
