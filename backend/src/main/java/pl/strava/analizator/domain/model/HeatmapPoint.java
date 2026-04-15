package pl.strava.analizator.domain.model;

public record HeatmapPoint(double lat, double lon) {
    public HeatmapPoint add(HeatmapPoint other) {
        return new HeatmapPoint(lat + other.lat, lon + other.lon);
    }
    public HeatmapPoint subtract(HeatmapPoint other) {
        return new HeatmapPoint(lat - other.lat, lon - other.lon);
    }
    public HeatmapPoint scale(double s) {
        return new HeatmapPoint(lat * s, lon * s);
    }
    public double dot(HeatmapPoint other) {
        return lat * other.lat + lon * other.lon;
    }
    public double magnitude() {
        return Math.sqrt(lat * lat + lon * lon);
    }
    public HeatmapPoint normalize() {
        double m = magnitude();
        return m > 0 ? scale(1.0 / m) : this;
    }
    public static HeatmapPoint zero() { return new HeatmapPoint(0, 0); }
}
