package pl.strava.analizator.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class Gear {

    private UUID id;
    private String externalId;
    private String name;
    private String type;
    private String brand;
    private String model;
    private Integer weightG;
    private BigDecimal totalDistanceM;
    private boolean retired;
    private Instant createdAt;
}
