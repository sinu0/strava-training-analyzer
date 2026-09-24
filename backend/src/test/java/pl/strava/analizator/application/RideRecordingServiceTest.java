package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.RideSampleDto;
import pl.strava.analizator.domain.model.RideSample;
import pl.strava.analizator.domain.model.WorkoutExecution;
import pl.strava.analizator.domain.port.ActivityFileEncoder;
import pl.strava.analizator.domain.port.RideRecordingRepository;
import pl.strava.analizator.domain.port.WorkoutExecutionRepository;

@ExtendWith(MockitoExtension.class)
class RideRecordingServiceTest {
    private static final UUID EXECUTION = UUID.fromString("00000000-0000-0000-0000-00000000e2e0");

    @Mock WorkoutExecutionRepository executions;
    @Mock RideRecordingRepository recordings;
    @Mock ActivityFileEncoder encoder;
    @InjectMocks RideRecordingService service;

    private static RideSampleDto sample(int second, Integer power, Integer heartRate) {
        return RideSampleDto.builder().atMs(1_700_000_000_000L + second * 1000L).elapsedMs(second * 1000L).stepIndex(0)
                .powerWatts(power).heartRateBpm(heartRate).cadenceRpm(90).speedKph(32.5).build();
    }

    @Test
    void storesAChunkWithImplausibleValuesDropped() {
        when(executions.findById(EXECUTION)).thenReturn(Optional.of(WorkoutExecution.builder().id(EXECUTION).build()));

        service.saveChunk(EXECUTION, 3, List.of(sample(0, 250, 140), sample(1, 9_999, 400), sample(2, -5, 12)));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<RideSample>> saved = ArgumentCaptor.forClass(List.class);
        verify(recordings).saveChunk(eq(EXECUTION), eq(3), saved.capture());
        assertThat(saved.getValue()).extracting(RideSample::getPowerWatts).containsExactly(250, null, null);
        assertThat(saved.getValue()).extracting(RideSample::getHeartRateBpm).containsExactly(140, null, null);
        assertThat(saved.getValue().get(0).getAt()).isEqualTo(Instant.ofEpochMilli(1_700_000_000_000L));
    }

    @Test
    void rejectsUnknownExecutionAndOversizedChunks() {
        when(executions.findById(any())).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.saveChunk(EXECUTION, 0, List.of(sample(0, 200, 120))))
                .isInstanceOf(RideRecordingNotFoundException.class);

        List<RideSampleDto> tooMany = IntStream.range(0, 601).mapToObj(second -> sample(second, 200, 120)).toList();
        assertThatThrownBy(() -> service.saveChunk(EXECUTION, 0, tooMany)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.saveChunk(EXECUTION, -1, List.of(sample(0, 200, 120)))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.saveChunk(EXECUTION, 0, Collections.emptyList())).isInstanceOf(IllegalArgumentException.class);
        verify(recordings, never()).saveChunk(any(), anyInt(), any());
    }

    @Test
    void exportsRecordedSamplesInOrderWithoutDuplicates() {
        WorkoutExecution execution = WorkoutExecution.builder().id(EXECUTION).build();
        when(executions.findById(EXECUTION)).thenReturn(Optional.of(execution));
        RideSample first = RideSample.builder().at(Instant.ofEpochSecond(10)).elapsedMs(0).build();
        RideSample second = RideSample.builder().at(Instant.ofEpochSecond(11)).elapsedMs(1000).build();
        when(recordings.findByExecution(EXECUTION)).thenReturn(List.of(second, first, second));
        when(encoder.encode(eq(execution), any())).thenReturn(new byte[] {1, 2, 3});

        assertThat(service.exportActivityFit(EXECUTION)).containsExactly(1, 2, 3);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<RideSample>> passed = ArgumentCaptor.forClass(List.class);
        verify(encoder).encode(eq(execution), passed.capture());
        assertThat(passed.getValue()).containsExactly(first, second);
    }

    @Test
    void exportWithoutRecordingIsNotFound() {
        when(executions.findById(EXECUTION)).thenReturn(Optional.of(WorkoutExecution.builder().id(EXECUTION).build()));
        when(recordings.findByExecution(EXECUTION)).thenReturn(List.of());
        assertThatThrownBy(() -> service.exportActivityFit(EXECUTION)).isInstanceOf(RideRecordingNotFoundException.class);
    }
}
