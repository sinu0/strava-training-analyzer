package pl.strava.analizator.domain.model;

import java.util.Locale;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.extern.jackson.Jacksonized;

@Getter
@Builder(toBuilder = true)
@AllArgsConstructor
@Jacksonized
public class RoutePlanningPreferences {

    @Builder.Default
    private TrafficPreference trafficPreference = TrafficPreference.QUIETER;

    @Builder.Default
    private SurfacePreference surfacePreference = SurfacePreference.ASPHALT;

    @Builder.Default
    private DistancePreference distancePreference = DistancePreference.BALANCED;

    @Builder.Default
    private ClimbPreference climbPreference = ClimbPreference.BALANCED;

    public static RoutePlanningPreferences defaults() {
        return RoutePlanningPreferences.builder().build();
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> enumType, String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim()
                .replace('-', '_')
                .replace(' ', '_')
                .toUpperCase(Locale.ROOT);
        return Enum.valueOf(enumType, normalized);
    }

    public enum TrafficPreference {
        QUIETER,
        BALANCED,
        DIRECT;

        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static TrafficPreference fromJson(String value) {
            return parseEnum(TrafficPreference.class, value);
        }

        @JsonValue
        public String toJson() {
            return name().toLowerCase(Locale.ROOT);
        }
    }

    public enum SurfacePreference {
        ASPHALT,
        BALANCED,
        GRAVEL;

        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static SurfacePreference fromJson(String value) {
            return parseEnum(SurfacePreference.class, value);
        }

        @JsonValue
        public String toJson() {
            return name().toLowerCase(Locale.ROOT);
        }
    }

    public enum DistancePreference {
        SHORTEST,
        BALANCED,
        LONGER;

        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static DistancePreference fromJson(String value) {
            return parseEnum(DistancePreference.class, value);
        }

        @JsonValue
        public String toJson() {
            return name().toLowerCase(Locale.ROOT);
        }
    }

    public enum ClimbPreference {
        FLATTER,
        BALANCED,
        HILLIER;

        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static ClimbPreference fromJson(String value) {
            return parseEnum(ClimbPreference.class, value);
        }

        @JsonValue
        public String toJson() {
            return name().toLowerCase(Locale.ROOT);
        }
    }
}
