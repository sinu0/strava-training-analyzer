package pl.strava.analizator.infrastructure.strava;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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
        Map<String, StravaStreamDto> streamMap = (streams != null && !streams.isEmpty())
                ? streams.stream().collect(Collectors.toMap(StravaStreamDto::getType, s -> s, (a, b) -> a))
                : Map.of();

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
                .elevationGainM(computeElevationGain(dto, streamMap))
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
                .elevationLossM(computeElevationLoss(streamMap))
                .gearId(null)
                .summaryPolyline(dto.getMap() != null ? dto.getMap().getSummaryPolyline() : null)
                .photoUrls(photoUrls != null ? photoUrls.stream().filter(Objects::nonNull).toList() : List.of());

        if (!streamMap.isEmpty()) {
            builder.powerStream(extractIntStream(streamMap.get("watts")))
                    .heartrateStream(extractIntStream(streamMap.get("heartrate")))
                    .cadenceStream(extractIntStream(streamMap.get("cadence")))
                    .altitudeStream(extractDoubleStream(streamMap.get("altitude")))
                    .timeStream(extractIntStream(streamMap.get("time")))
                    .distanceStream(extractDoubleStream(streamMap.get("distance")))
                    .velocityStream(extractDoubleStream(streamMap.get("velocity_smooth")));

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

        double[] altitudeArr = builder.build().getAltitudeStream();
        if (dto.getLaps() != null && !dto.getLaps().isEmpty()) {
            List<Lap> laps = new ArrayList<>();
            for (int i = 0; i < dto.getLaps().size(); i++) {
                StravaActivityDto.LapData lapDto = dto.getLaps().get(i);
                int startIdx = lapDto.getStartIndex() != null ? lapDto.getStartIndex() : -1;
                int endIdx = lapDto.getEndIndex() != null ? lapDto.getEndIndex() : -1;

                BigDecimal lapElevGain = lapDto.getTotalElevationGain();
                if (lapElevGain == null && altitudeArr != null && startIdx >= 0 && endIdx > startIdx
                        && endIdx <= altitudeArr.length) {
                    lapElevGain = computeElevationGainForRange(altitudeArr, startIdx, endIdx);
                }

                laps.add(Lap.builder()
                        .name(lapDto.getName())
                        .lapIndex(i)
                        .startIndex(startIdx >= 0 ? startIdx : null)
                        .endIndex(endIdx >= 0 ? endIdx : null)
                        .distanceM(lapDto.getDistance())
                        .elapsedTimeSec(lapDto.getElapsedTime())
                        .movingTimeSec(lapDto.getMovingTime())
                        .avgSpeedMs(lapDto.getAverageSpeed())
                        .maxSpeedMs(lapDto.getMaxSpeed())
                        .avgHeartrate(toShort(lapDto.getAverageHeartrate()))
                        .maxHeartrate(toShort(lapDto.getMaxHeartrate()))
                        .avgPowerW(toShort(lapDto.getAverageWatts()))
                        .maxPowerW(toShort(lapDto.getMaxWatts()))
                        .avgCadence(toShort(lapDto.getAverageCadence()))
                        .totalElevationGain(lapElevGain)
                        .build());
            }
            builder.laps(laps);
        }

        return builder.build();
    }

    private BigDecimal computeElevationGain(StravaActivityDto dto, Map<String, StravaStreamDto> streamMap) {
        double[] altitudeArr = extractDoubleStream(streamMap.get("altitude"));
        if (altitudeArr != null && altitudeArr.length >= 2) {
            double gain = 0;
            for (int i = 1; i < altitudeArr.length; i++) {
                double delta = altitudeArr[i] - altitudeArr[i - 1];
                if (delta > 0) {
                    gain += delta;
                }
            }
            if (gain > 0) {
                return BigDecimal.valueOf(gain).setScale(1, RoundingMode.HALF_UP);
            }
        }
        return dto.getTotalElevationGain();
    }

    private BigDecimal computeElevationLoss(Map<String, StravaStreamDto> streamMap) {
        double[] altitudeArr = extractDoubleStream(streamMap.get("altitude"));
        if (altitudeArr == null || altitudeArr.length < 2) {
            return null;
        }
        double descent = 0;
        for (int i = 1; i < altitudeArr.length; i++) {
            double delta = altitudeArr[i] - altitudeArr[i - 1];
            if (delta < 0) {
                descent += -delta;
            }
        }
        return descent > 0 ? BigDecimal.valueOf(descent).setScale(1, RoundingMode.HALF_UP) : null;
    }

    private BigDecimal computeElevationGainForRange(double[] altitudeArr, int startIdx, int endIdx) {
        double gain = 0;
        for (int i = startIdx + 1; i < endIdx && i < altitudeArr.length; i++) {
            double delta = altitudeArr[i] - altitudeArr[i - 1];
            if (delta > 0) {
                gain += delta;
            }
        }
        return gain > 0 ? BigDecimal.valueOf(gain).setScale(1, RoundingMode.HALF_UP) : null;
    }

    private String mapSportType(String stravaSportType) {
        if (stravaSportType == null) {
            return "unknown";
        }
        return switch (stravaSportType) {
            case "Ride", "MountainBikeRide", "GravelRide", "EBikeRide" -> "cycling";
            case "VirtualRide" -> "virtual_ride";
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

}
