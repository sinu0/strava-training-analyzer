package pl.strava.analizator.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.Instant;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "weather_forecast_cache", uniqueConstraints = {
        @UniqueConstraint(name = "uq_weather_cache_location_date", columnNames = {"location_name", "forecast_date"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherCacheEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "location_name", nullable = false)
    private String locationName;

    @Column(name = "latitude", nullable = false)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false)
    private BigDecimal longitude;

    @Column(name = "forecast_date", nullable = false)
    private LocalDate forecastDate;

    @Column(name = "daily_score", nullable = false)
    private short dailyScore;

    @Column(name = "best_window_start")
    private String bestWindowStart;

    @Column(name = "best_window_end")
    private String bestWindowEnd;

    @Column(name = "best_window_score")
    private Short bestWindowScore;

    @Column(name = "temp_min")
    private BigDecimal tempMin;

    @Column(name = "temp_max")
    private BigDecimal tempMax;

    @Column(name = "precipitation_sum")
    private BigDecimal precipitationSum;

    @Column(name = "wind_speed_max")
    private BigDecimal windSpeedMax;

    @Column(name = "weather_code")
    private Short weatherCode;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "hourly_scores", columnDefinition = "jsonb", nullable = false)
    private String hourlyScores;

    @Column(name = "computed_at", nullable = false)
    private Instant computedAt;
}
