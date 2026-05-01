package pl.strava.analizator.infrastructure.persistence.mapper;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.vo.Lap;
import pl.strava.analizator.infrastructure.persistence.entity.ActivityEntity;

@Mapper(componentModel = "spring")
public interface ActivityEntityMapper {

    @Mapping(target = "powerStream", source = "streams", qualifiedByName = "extractPowerStream")
    @Mapping(target = "heartrateStream", source = "streams", qualifiedByName = "extractHeartrateStream")
    @Mapping(target = "cadenceStream", source = "streams", qualifiedByName = "extractCadenceStream")
    @Mapping(target = "altitudeStream", source = "streams", qualifiedByName = "extractAltitudeStream")
    @Mapping(target = "timeStream", source = "streams", qualifiedByName = "extractTimeStream")
    @Mapping(target = "latStream", source = "streams", qualifiedByName = "extractLatStream")
    @Mapping(target = "lngStream", source = "streams", qualifiedByName = "extractLngStream")
    @Mapping(target = "distanceStream", source = "streams", qualifiedByName = "extractDistanceStream")
    @Mapping(target = "velocityStream", source = "streams", qualifiedByName = "extractVelocityStream")
    @Mapping(target = "tags", source = "tags", qualifiedByName = "arrayToList")
    @Mapping(target = "laps", source = "laps", qualifiedByName = "mapsToLaps")
    Activity toDomain(ActivityEntity entity);

    @Mapping(target = "streams", source = ".", qualifiedByName = "buildStreamsJson")
    @Mapping(target = "splits", ignore = true)
    @Mapping(target = "laps", source = "laps", qualifiedByName = "lapsToMaps")
    @Mapping(target = "rawData", ignore = true)
    @Mapping(target = "weather", ignore = true)
    @Mapping(target = "tags", source = "tags", qualifiedByName = "listToArray")
    ActivityEntity toEntity(Activity domain);

    @Named("extractPowerStream")
    default int[] extractPowerStream(ActivityEntity.StreamsJson streams) {
        return streams != null ? streams.getPower() : null;
    }

    @Named("extractHeartrateStream")
    default int[] extractHeartrateStream(ActivityEntity.StreamsJson streams) {
        return streams != null ? streams.getHeartrate() : null;
    }

    @Named("extractCadenceStream")
    default int[] extractCadenceStream(ActivityEntity.StreamsJson streams) {
        return streams != null ? streams.getCadence() : null;
    }

    @Named("extractAltitudeStream")
    default double[] extractAltitudeStream(ActivityEntity.StreamsJson streams) {
        return streams != null ? streams.getAltitude() : null;
    }

    @Named("extractTimeStream")
    default int[] extractTimeStream(ActivityEntity.StreamsJson streams) {
        return streams != null ? streams.getTime() : null;
    }

    @Named("extractLatStream")
    default double[] extractLatStream(ActivityEntity.StreamsJson streams) {
        return streams != null ? streams.getLat() : null;
    }

    @Named("extractLngStream")
    default double[] extractLngStream(ActivityEntity.StreamsJson streams) {
        return streams != null ? streams.getLng() : null;
    }

    @Named("extractDistanceStream")
    default double[] extractDistanceStream(ActivityEntity.StreamsJson streams) {
        return streams != null ? streams.getDistance() : null;
    }

    @Named("extractVelocityStream")
    default double[] extractVelocityStream(ActivityEntity.StreamsJson streams) {
        return streams != null ? streams.getVelocity() : null;
    }

    @Named("buildStreamsJson")
    default ActivityEntity.StreamsJson buildStreamsJson(Activity domain) {
        if (domain.getPowerStream() == null && domain.getHeartrateStream() == null
                && domain.getCadenceStream() == null && domain.getAltitudeStream() == null
                && domain.getTimeStream() == null && domain.getLatStream() == null
                && domain.getDistanceStream() == null && domain.getVelocityStream() == null) {
            return null;
        }
        return ActivityEntity.StreamsJson.builder()
                .power(domain.getPowerStream())
                .heartrate(domain.getHeartrateStream())
                .cadence(domain.getCadenceStream())
                .altitude(domain.getAltitudeStream())
                .time(domain.getTimeStream())
                .lat(domain.getLatStream())
                .lng(domain.getLngStream())
                .distance(domain.getDistanceStream())
                .velocity(domain.getVelocityStream())
                .build();
    }

    @Named("arrayToList")
    default List<String> arrayToList(String[] array) {
        return array != null ? Arrays.asList(array) : null;
    }

    @Named("listToArray")
    default String[] listToArray(List<String> list) {
        return list != null ? list.toArray(new String[0]) : null;
    }

    @Named("mapsToLaps")
    default List<Lap> mapsToLaps(List<Map<String, Object>> maps) {
        if (maps == null) return null;
        return maps.stream().map(m -> Lap.builder()
                .name(getString(m, "name"))
                .lapIndex(getInt(m, "lapIndex"))
                .startIndex(getInt(m, "startIndex"))
                .endIndex(getInt(m, "endIndex"))
                .distanceM(getBigDecimal(m, "distanceM"))
                .elapsedTimeSec(getInt(m, "elapsedTimeSec"))
                .movingTimeSec(getInt(m, "movingTimeSec"))
                .avgSpeedMs(getBigDecimal(m, "avgSpeedMs"))
                .maxSpeedMs(getBigDecimal(m, "maxSpeedMs"))
                .avgHeartrate(getShort(m, "avgHeartrate"))
                .maxHeartrate(getShort(m, "maxHeartrate"))
                .avgPowerW(getShort(m, "avgPowerW"))
                .maxPowerW(getShort(m, "maxPowerW"))
                .avgCadence(getShort(m, "avgCadence"))
                .totalElevationGain(getBigDecimal(m, "totalElevationGain"))
                .normalizedPowerW(getShort(m, "normalizedPowerW"))
                .variabilityIndex(getBigDecimal(m, "variabilityIndex"))
                .powerDropPct(getBigDecimal(m, "powerDropPct"))
                .intensityClass(getString(m, "intensityClass"))
                .build()
        ).toList();
    }

    @Named("lapsToMaps")
    default List<Map<String, Object>> lapsToMaps(List<Lap> laps) {
        if (laps == null) return null;
        return laps.stream().map(lap -> {
            Map<String, Object> m = new HashMap<>();
            m.put("name", lap.getName());
            m.put("lapIndex", lap.getLapIndex());
            m.put("startIndex", lap.getStartIndex());
            m.put("endIndex", lap.getEndIndex());
            m.put("distanceM", lap.getDistanceM());
            m.put("elapsedTimeSec", lap.getElapsedTimeSec());
            m.put("movingTimeSec", lap.getMovingTimeSec());
            m.put("avgSpeedMs", lap.getAvgSpeedMs());
            m.put("maxSpeedMs", lap.getMaxSpeedMs());
            m.put("avgHeartrate", lap.getAvgHeartrate());
            m.put("maxHeartrate", lap.getMaxHeartrate());
            m.put("avgPowerW", lap.getAvgPowerW());
            m.put("maxPowerW", lap.getMaxPowerW());
            m.put("avgCadence", lap.getAvgCadence());
            m.put("totalElevationGain", lap.getTotalElevationGain());
            m.put("normalizedPowerW", lap.getNormalizedPowerW());
            m.put("variabilityIndex", lap.getVariabilityIndex());
            m.put("powerDropPct", lap.getPowerDropPct());
            m.put("intensityClass", lap.getIntensityClass());
            return m;
        }).toList();
    }

    private static String getString(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private static Integer getInt(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v instanceof Number n) return n.intValue();
        return null;
    }

    private static Short getShort(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v instanceof Number n) return n.shortValue();
        return null;
    }

    private static BigDecimal getBigDecimal(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return null;
    }
}
