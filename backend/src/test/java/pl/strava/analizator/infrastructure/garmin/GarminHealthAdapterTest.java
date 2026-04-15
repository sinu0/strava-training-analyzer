package pl.strava.analizator.infrastructure.garmin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
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
import pl.strava.analizator.infrastructure.config.EncryptionUtil;
import pl.strava.analizator.infrastructure.garmin.dto.GarminDailySummaryDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminHeartRateDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminHrvDto;
import pl.strava.analizator.infrastructure.garmin.dto.GarminSleepDto;

@ExtendWith(MockitoExtension.class)
class GarminHealthAdapterTest {

    @Mock
    private GarminConnectClient garminClient;

    @Mock
    private AthleteProfileRepository profileRepository;

    @Mock
    private EncryptionUtil encryptionUtil;

    private GarminHealthAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new GarminHealthAdapter(garminClient, profileRepository, encryptionUtil);
    }

    @Test
    void sourceNameReturnsGarmin() {
        assertThat(adapter.sourceName()).isEqualTo("garmin");
    }

    @Test
    void mapToDailySummaryWithAllData() {
        LocalDate date = LocalDate.of(2024, 3, 15);

        GarminDailySummaryDto summary = GarminDailySummaryDto.builder()
                .steps(10500)
                .activeCalories(450)
                .stressAvg(35)
                .restingHeartRate(52)
                .bodyBattery(75)
                .build();

        GarminHeartRateDto heartRate = GarminHeartRateDto.builder()
                .restingHeartRate(51)
                .maxHeartRate(175)
                .minHeartRate(40)
                .build();

        GarminSleepDto.SleepScores.ScoreValue scoreValue = new GarminSleepDto.SleepScores.ScoreValue();
        scoreValue.setValue(82);
        GarminSleepDto.SleepScores sleepScores = new GarminSleepDto.SleepScores();
        sleepScores.setOverall(scoreValue);

        GarminSleepDto sleep = GarminSleepDto.builder()
                .sleepTimeSeconds(28800)
                .deepSleepSeconds(7200)
                .lightSleepSeconds(14400)
                .remSleepSeconds(5400)
                .awakeSleepSeconds(1800)
                .sleepScores(sleepScores)
                .build();

        GarminHrvDto.HrvSummary hrvSummary = new GarminHrvDto.HrvSummary();
        hrvSummary.setLastNightAvg(45.5);
        GarminHrvDto hrv = GarminHrvDto.builder()
                .hrvSummary(hrvSummary)
                .build();

        DailySummary result = adapter.mapToDailySummary(date, summary, heartRate, sleep, hrv);

        assertThat(result.getDate()).isEqualTo(date);
        assertThat(result.getSteps()).isEqualTo(10500);
        assertThat(result.getActiveCalories()).isEqualTo(450);
        assertThat(result.getStressAvg()).isEqualTo((short) 35);
        // Heart rate endpoint overrides summary's resting HR
        assertThat(result.getRestingHrBpm()).isEqualTo((short) 51);
        assertThat(result.getSleepDurationSeconds()).isEqualTo(28800);
        assertThat(result.getSleepScore()).isEqualTo((short) 82);
        assertThat(result.getBodyBattery()).isEqualTo((short) 75);
        assertThat(result.getHrvRmssd()).isEqualByComparingTo(new BigDecimal("45.5"));
        assertThat(result.getDeepSleepSeconds()).isEqualTo(7200);
        assertThat(result.getLightSleepSeconds()).isEqualTo(14400);
        assertThat(result.getRemSleepSeconds()).isEqualTo(5400);
        assertThat(result.getAwakeSleepSeconds()).isEqualTo(1800);
        assertThat(result.getGarminSyncedAt()).isNotNull();
    }

    @Test
    void mapToDailySummaryWithNullSummary() {
        LocalDate date = LocalDate.of(2024, 3, 15);

        GarminHeartRateDto heartRate = GarminHeartRateDto.builder()
                .restingHeartRate(55)
                .build();

        DailySummary result = adapter.mapToDailySummary(date, null, heartRate, null, null);

        assertThat(result.getDate()).isEqualTo(date);
        assertThat(result.getSteps()).isNull();
        assertThat(result.getActiveCalories()).isNull();
        assertThat(result.getRestingHrBpm()).isEqualTo((short) 55);
        assertThat(result.getSleepDurationSeconds()).isNull();
        assertThat(result.getSleepScore()).isNull();
        assertThat(result.getGarminSyncedAt()).isNotNull();
    }

    @Test
    void mapToDailySummaryWithAllNulls() {
        LocalDate date = LocalDate.of(2024, 3, 15);

        DailySummary result = adapter.mapToDailySummary(date, null, null, null, null);

        assertThat(result.getDate()).isEqualTo(date);
        assertThat(result.getSteps()).isNull();
        assertThat(result.getRestingHrBpm()).isNull();
        assertThat(result.getSleepScore()).isNull();
        assertThat(result.getGarminSyncedAt()).isNotNull();
    }

    @Test
    void mapToDailySummarySleepWithoutScores() {
        LocalDate date = LocalDate.of(2024, 3, 15);

        GarminSleepDto sleep = GarminSleepDto.builder()
                .sleepTimeSeconds(25200)
                .sleepScores(null)
                .build();

        DailySummary result = adapter.mapToDailySummary(date, null, null, sleep, null);

        assertThat(result.getSleepDurationSeconds()).isEqualTo(25200);
        assertThat(result.getSleepScore()).isNull();
    }

    @Test
    void fetchDailyHealthStopsImmediatelyOnCloudflareBlock() {
        LocalDate date = LocalDate.of(2024, 3, 15);
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .name("Test rider")
                .garminUserId("blocked@example.com")
                .garminToken("encrypted")
                .build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(encryptionUtil.decrypt("encrypted")).thenReturn("secret");
        when(garminClient.isAuthenticated()).thenReturn(false);
        when(garminClient.authenticate("blocked@example.com", "secret")).thenReturn(false);
        when(garminClient.getLastAuthFailure()).thenReturn(
                new GarminConnectClient.AuthFailure(
                        "Garmin Connect login blocked by Cloudflare for blocked@example.com",
                        false));

        assertThatThrownBy(() -> adapter.fetchDailyHealth(date))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cloudflare");

        verify(garminClient, times(1)).authenticate("blocked@example.com", "secret");
    }
}
