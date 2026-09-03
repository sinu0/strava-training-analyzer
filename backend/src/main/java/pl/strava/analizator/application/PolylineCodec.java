package pl.strava.analizator.application;

import java.util.ArrayList;
import java.util.List;

public final class PolylineCodec {

    private PolylineCodec() {
    }

    public static List<double[]> decodeToLatLng(String encoded) {
        List<double[]> coords = new ArrayList<>();
        if (encoded == null || encoded.isBlank()) {
            return coords;
        }

        int index = 0;
        int lat = 0;
        int lng = 0;

        while (index < encoded.length()) {
            int shift = 0;
            int result = 0;
            int value;
            do {
                value = encoded.charAt(index++) - 63;
                result |= (value & 0x1f) << shift;
                shift += 5;
            } while (value >= 0x20);
            lat += ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));

            shift = 0;
            result = 0;
            do {
                value = encoded.charAt(index++) - 63;
                result |= (value & 0x1f) << shift;
                shift += 5;
            } while (value >= 0x20);
            lng += ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));

            coords.add(new double[]{lat / 1e5, lng / 1e5});
        }

        return coords;
    }

    public static List<double[]> decodeToLngLat(String encoded) {
        return decodeToLatLng(encoded).stream()
                .map(point -> new double[]{point[1], point[0]})
                .toList();
    }

    public static String encodeLatLng(double[] latitudes, double[] longitudes, int startIndex, int endIndex) {
        if (latitudes == null || longitudes == null || latitudes.length == 0 || longitudes.length == 0) {
            return null;
        }
        int start = Math.max(0, startIndex);
        int end = Math.min(Math.min(latitudes.length, longitudes.length) - 1, endIndex);
        if (end < start) return null;
        StringBuilder encoded = new StringBuilder();
        int previousLat = 0;
        int previousLng = 0;
        for (int i = start; i <= end; i++) {
            int lat = (int) Math.round(latitudes[i] * 1e5);
            int lng = (int) Math.round(longitudes[i] * 1e5);
            encodeValue(lat - previousLat, encoded);
            encodeValue(lng - previousLng, encoded);
            previousLat = lat;
            previousLng = lng;
        }
        return encoded.toString();
    }

    public static String encodeLatLng(List<double[]> points) {
        if (points == null || points.isEmpty()) return null;
        double[] latitudes = new double[points.size()];
        double[] longitudes = new double[points.size()];
        for (int i = 0; i < points.size(); i++) {
            latitudes[i] = points.get(i)[0];
            longitudes[i] = points.get(i)[1];
        }
        return encodeLatLng(latitudes, longitudes, 0, points.size() - 1);
    }

    private static void encodeValue(int delta, StringBuilder target) {
        int value = delta < 0 ? ~(delta << 1) : delta << 1;
        while (value >= 0x20) {
            target.append((char) ((0x20 | (value & 0x1f)) + 63));
            value >>= 5;
        }
        target.append((char) (value + 63));
    }
}
