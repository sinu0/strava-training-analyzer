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
}
