package pl.strava.analizator.infrastructure.strava;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.vo.Lap;
import pl.strava.analizator.infrastructure.strava.dto.StravaActivityDto;
import pl.strava.analizator.infrastructure.strava.dto.StravaStreamDto;

@Component
public class StravaActivityMapper {

    public Activity toDomain(StravaActivityDto dto, List<StravaStreamDto> streams) {
        return toDomain(dto, streams, List.of());
    }

    public Activity toDomain(StravaActivityDto dto, List<StravaStreamDto> streams, List<String> photoUrls) {
        Activity.ActivityBuilder builder = Activity.builder()
                .externalId(String.valueOf(dto.getId()))
                .source("strava")
                .sportType(mapSportType(dto.getSportType()))
                .name(dto.getName())
                .description(dto.getDescription())
                .startedAt(parseDate(dto.getStartDate()))
                .elapsedTimeSec(dto.getElapsedTime())
                .movingTimeSec(dto.getMovingTime())
                .distanceM(dto.getDistance())
                .elevationGainM(dto.getTotalElevationGain())
                .avgSpeedMs(dto.getAverageSpeed())
                .maxSpeedMs(dto.getMaxSpeed())
                .avgHeartrate(toShort(dto.getAverageHeartrate()))
                .maxHeartrate(toShort(dto.getMaxHeartrate()))
                .avgPowerW(toShort(dto.getAverageWatts()))
                .maxPowerW(toShort(dto.getMaxWatts()))
                .avgCadence(toShort(dto.getAverageCadence()))
                .maxCadence(resolveMaxCadence(dto, streams))
                .calories(toInteger(dto.getCalories()))
                .avgTempC(dto.getAverageTemp())
                .elevationLossM(calculateElevationLoss(streams))
                .gearId(null) // gear mapped externally if needed
                .summaryPolyline(dto.getMap() != null ? dto.getMap().getSummaryPolyline() : null)
                .photoUrls(photoUrls != null ? photoUrls.stream().filter(Objects::nonNull).toList() : List.of());

        if (streams != null && !streams.isEmpty()) {
            Map<String, StravaStreamDto> streamMap = streams.stream()
                    .collect(Collectors.toMap(StravaStreamDto::getType, s -> s, (a, b) -> a));

            builder.powerStream(extractIntStream(streamMap.get("watts")))
                    .heartrateStream(extractIntStream(streamMap.get("heartrate")))
                    .cadenceStream(extractIntStream(streamMap.get("cadence")))
                    .altitudeStream(extractDoubleStream(streamMap.get("altitude")))
                    .timeStream(extractIntStream(streamMap.get("time")))
                    .distanceStream(extractDoubleStream(streamMap.get("distance")))
                    .velocityStream(extractDoubleStream(streamMap.get("velocity_smooth")));

            // latlng stream: Strava returns [[lat,lng], [lat,lng], ...] — split into two arrays
            StravaStreamDto latlngStream = streamMap.get("latlng");
            if (latlngStream != null && latlngStream.getData() != null) {
                List<Object> latlngData = latlngStream.getData();
                double[] lats = new double[latlngData.size()];
                double[] lngs = new double[latlngData.size()];
                for (int i = 0; i < latlngData.size(); i++) {
                    if (latlngData.get(i) instanceof List<?> pair && pair.size() >= 2) {
                        lats[i] = pair.get(0) instanceof Number n ? n.doubleValue() : 0.0;
                        lngs[i] = pair.get(1) instanceof Number n ? n.doubleValue() : 0.0;
                    }
                }
                builder.latStream(lats).lngStream(lngs);
            }
        }

        // Map laps
        if (dto.getLaps() != null && !dto.getLaps().isEmpty()) {
            List<Lap> laps = new java.util.ArrayList<>();
            for (int i = 0; i < dto.getLaps().size(); i++) {
                StravaActivityDto.LapData lap = dto.getLaps().get(i);
                laps.add(Lap.builder()
                        .name(lap.getName())
                        .lapIndex(i)
                        .distanceM(lap.getDistance())
                        .elapsedTimeSec(lap.getElapsedTime())
                        .movingTimeSec(lap.getMovingTime())
                        .avgSpeedMs(lap.getAverageSpeed())
                        .avgHeartrate(toShort(lap.getAverageHeartrate()))
                        .avgPowerW(toShort(lap.getAverageWatts()))
                        .avgCadence(toShort(lap.getAverageCadence()))
                        .build());
            }
            builder.laps(laps);
        }

        return builder.build();
    }

    private String mapSportType(String stravaSportType) {
        if (stravaSportType == null) {
            return "unknown";
        }
        return switch (stravaSportType) {
            case "Ride", "MountainBikeRide", "GravelRide", "EBikeRide", "VirtualRide" -> "cycling";
            case "Run", "TrailRun", "VirtualRun" -> "running";
            case "Swim" -> "swimming";
            case "Walk", "Hike" -> "walking";
            case "WeightTraining", "Workout" -> "strength";
            default -> stravaSportType.toLowerCase();
        };
    }

    private OffsetDateTime parseDate(String dateStr) {
        if (dateStr == null) {
            return null;
        }
        return OffsetDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
    }

    private Short toShort(BigDecimal value) {
        return value != null ? value.shortValue() : null;
    }

    private Integer toInteger(BigDecimal value) {
        return value != null ? value.setScale(0, RoundingMode.HALF_UP).intValue() : null;
    }

    private int[] extractIntStream(StravaStreamDto stream) {
        if (stream == null || stream.getData() == null) {
            return null;
        }
        return stream.getData().stream()
                .mapToInt(v -> v instanceof Number n ? n.intValue() : 0)
                .toArray();
    }

    private double[] extractDoubleStream(StravaStreamDto stream) {
        if (stream == null || stream.getData() == null) {
            return null;
        }
        return stream.getData().stream()
                .mapToDouble(v -> v instanceof Number n ? n.doubleValue() : 0.0)
                .toArray();
    }

    private Short resolveMaxCadence(StravaActivityDto dto, List<StravaStreamDto> streams) {
        Short dtoValue = toShort(dto.getMaxCadence());
        if (dtoValue != null) {
            return dtoValue;
        }
        if (streams == null) {
            return null;
        }
        return streams.stream()
                .filter(stream -> "cadence".equals(stream.getType()))
                .findFirst()
                .map(this::extractIntStream)
                .filter(values -> values != null && values.length > 0)
                .map(values -> {
                    int max = 0;
                    for (int value : values) {
                        if (value > max) {
                            max = value;
                        }
                    }
                    return max > 0 ? (short) max : null;
                })
                .orElse(null);
    }

    private BigDecimal calculateElevationLoss(List<StravaStreamDto> streams) {
        if (streams == null) {
            return null;
        }
        double[] altitudeStream = streams.stream()
                .filter(stream -> "altitude".equals(stream.getType()))
                .findFirst()
                .map(this::extractDoubleStream)
                .orElse(null);
        if (altitudeStream == null || altitudeStream.length < 2) {
            return null;
        }
        double descent = 0;
        for (int index = 1; index < altitudeStream.length; index++) {
            double delta = altitudeStream[index] - altitudeStream[index - 1];
            if (delta < 0) {
                descent += -delta;
            }
        }
        return descent > 0 ? BigDecimal.valueOf(descent).setScale(1, RoundingMode.HALF_UP) : null;
    }
}
