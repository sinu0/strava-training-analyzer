package pl.strava.analizator.infrastructure.persistence.entity;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "training_zones", uniqueConstraints = {
        @UniqueConstraint(name = "uq_zone", columnNames = {"zone_type", "zone_number", "valid_from"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingZoneEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "zone_type", nullable = false, length = 20)
    private String zoneType;

    @Column(name = "zone_number", nullable = false)
    private Short zoneNumber;

    @Column(name = "zone_name", length = 100)
    private String zoneName;

    @Column(name = "min_value", nullable = false)
    private Short minValue;

    @Column(name = "max_value")
    private Short maxValue;

    @Column(name = "color", length = 7)
    private String color;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;
}
