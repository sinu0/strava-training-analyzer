package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.port.HealthDataSource;

@ExtendWith(MockitoExtension.class)
class GarminSyncServiceTest {

    @Mock
    private HealthDataSource healthDataSource;

    @Mock
    private DailySummaryRepository dailySummaryRepository;

    @Mock
    private AthleteProfileRepository profileRepository;

    private GarminSyncService service;

    @BeforeEach
    void setUp() {
        service = new GarminSyncService(healthDataSource, dailySummaryRepository, profileRepository);
    }

    @Test
    void syncHealthDataCreatesNewSummaryWhenNoneExists() {
        LocalDate date = LocalDate.of(2024, 3, 15);

        DailySummary healthData = DailySummary.builder()
                .date(date)
                .restingHrBpm((short) 52)
                .steps(8500)
                .sleepScore((short) 85)
                .garminSyncedAt(Instant.now())
                .build();

        when(healthDataSource.fetchDailyHealth(date)).thenReturn(healthData);
        when(dailySummaryRepository.findByDate(date)).thenReturn(Optional.empty());
        when(dailySummaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        GarminSyncService.SyncResult result = service.syncHealthData(date, date);

        assertThat(result.synced()).isEqualTo(1);
        assertThat(result.skipped()).isEqualTo(0);
        assertThat(result.failed()).isEqualTo(0);

        verify(dailySummaryRepository).save(argThat(s ->
                s.getDate().equals(date)
                        && s.getRestingHrBpm() == 52
                        && s.getSteps() == 8500
                        && s.getId() != null));
    }

    @Test
    void syncHealthDataMergesIntoExistingSummary() {
        LocalDate date = LocalDate.of(2024, 3, 15);

        DailySummary existing = DailySummary.builder()
                .id(UUID.randomUUID())
                .date(date)
                .activitiesCount((short) 1)
                .totalDistanceM(BigDecimal.valueOf(50000))
                .totalTimeSec(3600)
                .totalElevationM(BigDecimal.valueOf(500))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        DailySummary healthData = DailySummary.builder()
                .date(date)
                .restingHrBpm((short) 52)
                .stressAvg((short) 30)
                .steps(12000)
                .activeCalories(600)
                .sleepScore((short) 78)
                .sleepDurationSeconds(27000)
                .deepSleepSeconds(7200)
                .garminSyncedAt(Instant.now())
                .build();

        when(healthDataSource.fetchDailyHealth(date)).thenReturn(healthData);
        when(dailySummaryRepository.findByDate(date)).thenReturn(Optional.of(existing));
        when(dailySummaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        GarminSyncService.SyncResult result = service.syncHealthData(date, date);

        assertThat(result.synced()).isEqualTo(1);

        verify(dailySummaryRepository).save(argThat(s ->
                s.getId().equals(existing.getId())
                        // Training fields preserved
                        && s.getActivitiesCount() == 1
                        && s.getTotalDistanceM().equals(BigDecimal.valueOf(50000))
                        && s.getTotalTimeSec() == 3600
                        // Health fields merged
                        && s.getRestingHrBpm() == 52
                        && s.getStressAvg() == 30
                        && s.getSteps() == 12000
                        && s.getActiveCalories() == 600
                        && s.getSleepScore() == 78
                        && s.getSleepDurationSeconds() == 27000
                        && s.getDeepSleepSeconds() == 7200
                        && s.getGarminSyncedAt() != null));
    }

    @Test
    void syncHealthDataSkipsWhenFetchReturnsNull() {
        LocalDate date = LocalDate.of(2024, 3, 15);

        when(healthDataSource.fetchDailyHealth(date)).thenReturn(null);

        GarminSyncService.SyncResult result = service.syncHealthData(date, date);

        assertThat(result.synced()).isEqualTo(0);
        assertThat(result.skipped()).isEqualTo(1);
        verify(dailySummaryRepository, never()).save(any());
    }

    @Test
    void syncHealthDataCountsFailuresOnException() {
        LocalDate date = LocalDate.of(2024, 3, 15);

        when(healthDataSource.fetchDailyHealth(date)).thenThrow(new RuntimeException("Connection error"));

        GarminSyncService.SyncResult result = service.syncHealthData(date, date);

        assertThat(result.synced()).isEqualTo(0);
        assertThat(result.failed()).isEqualTo(1);
    }

    @Test
    void syncHealthDataStopsRemainingDatesOnTerminalGarminFailure() {
        LocalDate from = LocalDate.of(2024, 3, 15);
        LocalDate to = LocalDate.of(2024, 3, 17);

        when(healthDataSource.fetchDailyHealth(from)).thenThrow(
                new RuntimeException("Garmin Connect login blocked by Cloudflare for blocked@example.com"));

        GarminSyncService.SyncResult result = service.syncHealthData(from, to);

        assertThat(result.synced()).isEqualTo(0);
        assertThat(result.failed()).isEqualTo(3);
        assertThat(result.errors()).hasSize(2);
        assertThat(result.errors().getFirst()).contains("Cloudflare");
        verify(healthDataSource, times(1)).fetchDailyHealth(any());
        verify(dailySummaryRepository, never()).save(any());
    }

    @Test
    void syncMultipleDaysProcessesEachDay() {
        LocalDate from = LocalDate.of(2024, 3, 14);
        LocalDate to = LocalDate.of(2024, 3, 16);

        DailySummary healthData = DailySummary.builder()
                .restingHrBpm((short) 50)
                .steps(9000)
                .garminSyncedAt(Instant.now())
                .build();

        when(healthDataSource.fetchDailyHealth(any())).thenReturn(healthData);
        when(dailySummaryRepository.findByDate(any())).thenReturn(Optional.empty());
        when(dailySummaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        GarminSyncService.SyncResult result = service.syncHealthData(from, to);

        assertThat(result.synced()).isEqualTo(3);
        verify(dailySummaryRepository, times(3)).save(any());
    }

    @Test
    void hasCredentialsReturnsTrueWhenConfigured() {
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .name("Test")
                .garminUserId("user@garmin.com")
                .garminToken("encrypted-password")
                .build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));

        assertThat(service.hasCredentials()).isTrue();
    }

    @Test
    void hasCredentialsReturnsFalseWhenNotConfigured() {
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .name("Test")
                .build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));

        assertThat(service.hasCredentials()).isFalse();
    }

    @Test
    void hasCredentialsReturnsFalseWhenNoProfile() {
        when(profileRepository.findFirst()).thenReturn(Optional.empty());

        assertThat(service.hasCredentials()).isFalse();
    }

    @Test
    void mergePreservesExistingHealthFieldsWhenNewIsNull() {
        LocalDate date = LocalDate.of(2024, 3, 15);

        DailySummary existing = DailySummary.builder()
                .id(UUID.randomUUID())
                .date(date)
                .restingHrBpm((short) 55)
                .bodyBattery((short) 70)
                .hrvRmssd(new BigDecimal("42.5"))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        // Health data with only some fields
        DailySummary healthData = DailySummary.builder()
                .date(date)
                .steps(7000)
                .garminSyncedAt(Instant.now())
                .build();

        when(healthDataSource.fetchDailyHealth(date)).thenReturn(healthData);
        when(dailySummaryRepository.findByDate(date)).thenReturn(Optional.of(existing));
        when(dailySummaryRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.syncHealthData(date, date);

        verify(dailySummaryRepository).save(argThat(s ->
                s.getRestingHrBpm() == 55     // kept from existing
                        && s.getBodyBattery() == 70   // kept from existing
                        && s.getHrvRmssd().compareTo(new BigDecimal("42.5")) == 0 // kept from existing
                        && s.getSteps() == 7000));    // new value
    }
}
