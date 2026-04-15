package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
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
@Table(name = "gear")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GearEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "external_id")
    private String externalId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "type", length = 50)
    private String type;

    @Column(name = "brand")
    private String brand;

    @Column(name = "model")
    private String model;

    @Column(name = "weight_g")
    private Integer weightG;

    @Column(name = "total_distance_m")
    private BigDecimal totalDistanceM;

    @Column(name = "retired")
    private boolean retired;

    @Column(name = "created_at")
    private Instant createdAt;
}
