package pl.strava.analizator.application;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.RideSampleDto;
import pl.strava.analizator.domain.model.RideSample;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.port.ActivityFileEncoder;
import pl.strava.analizator.domain.port.RideRecordingRepository;
import pl.strava.analizator.domain.port.WorkoutExecutionRepository;

/** In-app ride recording (trainer mode): durable 1 Hz samples and FIT export. */
@Service
@RequiredArgsConstructor
public class RideRecordingService {
    static final int MAX_SAMPLES_PER_CHUNK = 600;
    private static final int MAX_CHUNK_INDEX = 100_000;

    private final WorkoutExecutionRepository executions;
    private final RideRecordingRepository recordings;
    private final ActivityFileEncoder encoder;

    @Transactional
    public void saveChunk(UUID executionId, int chunkIndex, List<RideSampleDto> samples) {
        if (chunkIndex < 0 || chunkIndex > MAX_CHUNK_INDEX) {
            throw new IllegalArgumentException("Nieprawidłowy indeks paczki próbek: " + chunkIndex);
        }
        if (samples == null || samples.isEmpty() || samples.size() > MAX_SAMPLES_PER_CHUNK) {
            throw new IllegalArgumentException("Paczka musi zawierać od 1 do " + MAX_SAMPLES_PER_CHUNK + " próbek");
        }
        requireExecution(executionId);
        recordings.saveChunk(executionId, chunkIndex, samples.stream().map(RideRecordingService::toDomain).toList());
    }

    @Transactional(readOnly = true)
    public byte[] exportActivityFit(UUID executionId) {
        WorkoutExecution execution = requireExecution(executionId);
        Map<Long, RideSample> unique = new LinkedHashMap<>();
        recordings.findByExecution(executionId).stream()
                .sorted(Comparator.comparingLong(RideSample::getElapsedMs))
                .forEach(sample -> unique.putIfAbsent(sample.getElapsedMs(), sample));
        if (unique.isEmpty()) {
            throw new RideRecordingNotFoundException("Ten trening nie ma nagrania z aplikacji");
        }
        return encoder.encode(execution, List.copyOf(unique.values()));
    }

    private WorkoutExecution requireExecution(UUID executionId) {
        return executions.findById(executionId)
                .orElseThrow(() -> new RideRecordingNotFoundException("Nie znaleziono wykonania treningu: " + executionId));
    }

    private static RideSample toDomain(RideSampleDto dto) {
        return RideSample.builder()
                .at(Instant.ofEpochMilli(dto.getAtMs()))
                .elapsedMs(Math.max(0, dto.getElapsedMs()))
                .stepIndex(Math.max(0, dto.getStepIndex()))
                .powerWatts(within(dto.getPowerWatts(), 0, 3_000))
                .heartRateBpm(within(dto.getHeartRateBpm(), 25, 250))
                .cadenceRpm(within(dto.getCadenceRpm(), 0, 250))
                .speedKph(dto.getSpeedKph() != null && dto.getSpeedKph() >= 0 && dto.getSpeedKph() <= 120 ? dto.getSpeedKph() : null)
                .build();
    }

    private static Integer within(Integer value, int min, int max) {
        return value != null && value >= min && value <= max ? value : null;
    }
}
