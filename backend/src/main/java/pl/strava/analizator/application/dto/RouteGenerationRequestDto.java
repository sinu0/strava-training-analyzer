package pl.strava.analizator.application.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.databind.JsonNode;

import pl.strava.analizator.domain.model.RoutePlanningPreferences;

public record RouteGenerationRequestDto(
        StartPointDto startPoint,
        Integer targetDistanceKm,
        String style,
        Integer variationLevel,
        Long seed,
        RoutePlanningPreferences routePlanningPreferences
) {
    public double[] startPointCoordinates() {
        return startPoint == null ? null : startPoint.toArray();
    }

    public record StartPointDto(double lat, double lng) {
        @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
        public static StartPointDto from(JsonNode node) {
            if (node == null || node.isNull()) {
                return null;
            }
            if (node.isObject()) {
                return new StartPointDto(
                        readNumber(node.get("lat"), "lat"),
                        readNumber(node.get("lng"), "lng"));
            }
            if (node.isArray() && node.size() >= 2) {
                return new StartPointDto(
                        readNumber(node.get(0), "lat"),
                        readNumber(node.get(1), "lng"));
            }
            throw new IllegalArgumentException("startPoint must be an object {lat, lng} or array [lat, lng]");
        }

        public double[] toArray() {
            return new double[]{lat, lng};
        }

        private static double readNumber(JsonNode node, String fieldName) {
            if (node == null || !node.isNumber()) {
                throw new IllegalArgumentException("startPoint." + fieldName + " must be a number");
            }
            return node.doubleValue();
        }
    }
}
