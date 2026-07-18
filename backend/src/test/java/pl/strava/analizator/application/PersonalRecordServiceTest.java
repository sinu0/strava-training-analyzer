package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.gamification.PersonalRecord;
import pl.strava.analizator.domain.gamification.PersonalRecordType;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.PersonalRecordRepository;

@ExtendWith(MockitoExtension.class)
class PersonalRecordServiceTest {

    @Mock private PersonalRecordRepository recordRepository;
    @Mock private ActivityRepository activityRepository;
    @Mock private ActivityMetricRepository metricRepository;

    private PersonalRecordService service;

    @BeforeEach
    void setUp() {
        service = new PersonalRecordService(recordRepository, activityRepository, metricRepository);
    }

    @Test
    void detectNewRecords_mergesDuplicateExistingTypesAndUsesChronologicalPowerCurveEfforts() {
        PersonalRecord olderRecord = PersonalRecord.builder()
                .recordType(PersonalRecordType.BEST_5MIN_POWER)
                .recordValue(260)
                .build();
        PersonalRecord newerRecord = PersonalRecord.builder()
                .recordType(PersonalRecordType.BEST_5MIN_POWER)
                .recordValue(280)
                .build();
        when(recordRepository.findAll()).thenReturn(List.of(olderRecord, newerRecord));

        UUID olderId = UUID.randomUUID();
        UUID newerId = UUID.randomUUID();
        Activity newer = activity(newerId, 2024, 6, 2);
        Activity older = activity(olderId, 2024, 6, 1);
        when(activityRepository.findAll()).thenReturn(List.of(newer, older));
        when(metricRepository.findJsonValue(olderId, "power_curve"))
                .thenReturn(Optional.of(Map.of("efforts", Map.of("300", 290.0))));
        when(metricRepository.findJsonValue(newerId, "power_curve"))
                .thenReturn(Optional.of(Map.of("efforts", Map.of("300", 310.0))));

        List<PersonalRecord> records = service.detectNewRecords();

        assertThat(records).filteredOn(r -> r.getRecordType() == PersonalRecordType.BEST_5MIN_POWER)
                .extracting(PersonalRecord::getRecordValue)
                .containsExactly(290.0, 310.0);
        verify(recordRepository).save(org.mockito.ArgumentMatchers.argThat(record ->
                record.getRecordType() == PersonalRecordType.BEST_5MIN_POWER
                        && record.getRecordValue() == 310.0));
    }

    @Test
    void detectNewRecords_rejectsImplausiblePowerOutlier() {
        when(recordRepository.findAll()).thenReturn(List.of());
        UUID activityId = UUID.randomUUID();
        Activity activity = activity(activityId, 2024, 6, 1);
        when(activityRepository.findAll()).thenReturn(List.of(activity));
        when(metricRepository.findJsonValue(activityId, "power_curve"))
                .thenReturn(Optional.of(Map.of("efforts", Map.of("5", 5000.0))));

        List<PersonalRecord> records = service.detectNewRecords();

        assertThat(records).noneMatch(record -> record.getRecordType() == PersonalRecordType.BEST_5S_POWER);
    }

    private Activity activity(UUID id, int year, int month, int day) {
        return Activity.builder()
                .id(id)
                .sportType("Ride")
                .startedAt(OffsetDateTime.of(year, month, day, 8, 0, 0, 0, ZoneOffset.UTC))
                .build();
    }
}
