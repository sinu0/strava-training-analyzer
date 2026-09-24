package pl.strava.analizator.infrastructure.persistence.adapter;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import pl.strava.analizator.domain.model.RideSample;
import pl.strava.analizator.domain.port.RideRecordingRepository;
import pl.strava.analizator.infrastructure.persistence.entity.RideSampleChunkEntity;
import pl.strava.analizator.infrastructure.persistence.jpa.RideSampleChunkJpaRepository;

@Component
@RequiredArgsConstructor
public class RideRecordingRepositoryAdapter implements RideRecordingRepository {
    private final RideSampleChunkJpaRepository repository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    /** Stored JSON shape of a sample; decoupled from the domain model on purpose. */
    record StoredSample(long at, long elapsedMs, int stepIndex, Integer power, Integer heartRate, Integer cadence, Double speed) {
    }

    @Override
    @SneakyThrows
    public void saveChunk(UUID executionId, int chunkIndex, List<RideSample> samples) {
        List<StoredSample> stored = samples.stream().map(sample -> new StoredSample(sample.getAt().toEpochMilli(), sample.getElapsedMs(),
                sample.getStepIndex(), sample.getPowerWatts(), sample.getHeartRateBpm(), sample.getCadenceRpm(), sample.getSpeedKph())).toList();
        repository.save(RideSampleChunkEntity.builder()
                .id(new RideSampleChunkEntity.Key(executionId, chunkIndex))
                .samples(objectMapper.writeValueAsString(stored))
                .sampleCount(samples.size())
                .updatedAt(Instant.now(clock))
                .build());
    }

    @Override
    @SneakyThrows
    public List<RideSample> findByExecution(UUID executionId) {
        TypeReference<List<StoredSample>> type = new TypeReference<>() {};
        return repository.findByIdExecutionIdOrderByIdChunkIndexAsc(executionId).stream()
                .flatMap(chunk -> readSamples(chunk.getSamples(), type).stream())
                .map(sample -> RideSample.builder().at(Instant.ofEpochMilli(sample.at())).elapsedMs(sample.elapsedMs())
                        .stepIndex(sample.stepIndex()).powerWatts(sample.power()).heartRateBpm(sample.heartRate())
                        .cadenceRpm(sample.cadence()).speedKph(sample.speed()).build())
                .toList();
    }

    @SneakyThrows
    private List<StoredSample> readSamples(String json, TypeReference<List<StoredSample>> type) {
        return objectMapper.readValue(json, type);
    }
}
