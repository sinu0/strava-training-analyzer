package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.DailySummary;
import pl.strava.analizator.domain.port.DailySummaryRepository;
import pl.strava.analizator.domain.vo.DateRange;

@ExtendWith(MockitoExtension.class)
class HealthServiceTest {

    @Mock
    private DailySummaryRepository dailySummaryRepository;

    private HealthService healthService;

    @BeforeEach
    void setUp() {
        healthService = new HealthService(dailySummaryRepository);
    }

    // --- getOverview tests ---

    @Test
    void getOverviewWithNoData_returnsNullLatestAndEmptyTrends() {
        when(dailySummaryRepository.findByDateRange(any(DateRange.class))).thenReturn(List.of());

        HealthService.HealthOverview overview = healthService.getOverview(
                LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 30));

        assertThat(overview.latest()).isNull();
        assertThat(overview.hrvTrend().direction()).isEqualTo("brak danych");
        assertThat(overview.hrvTrend().current()).isNull();
        assertThat(overview.sleepTrend().latestScore()).isNull();
        assertThat(overview.stressTrend().current()).isNull();
        assertThat(overview.restingHrTrend().current()).isNull();
    }

    @Test
    void getOverviewWithData_calculatesHrvAndSleepTrends() {
        List<DailySummary> data = build7DaysOfHealthData();
        when(dailySummaryRepository.findByDateRange(any(DateRange.class))).thenReturn(data);

        HealthService.HealthOverview overview = healthService.getOverview(
                LocalDate.of(2024, 6, 1), LocalDate.of(2024, 6, 7));

        assertThat(overview.latest()).isNotNull();
        assertThat(overview.latest().getDate()).isEqualTo(LocalDate.of(2024, 6, 7));

        assertThat(overview.hrvTrend().current()).isNotNull();
        assertThat(overview.hrvTrend().periodAvg()).isNotNull();
        assertThat(overview.hrvTrend().sevenDayAvg()).isNotNull();
        assertThat(overview.hrvTrend().direction()).isIn("rosnący", "malejący", "stabilny");

        assertThat(overview.sleepTrend().latestScore()).isEqualTo((short) 84);
        assertThat(overview.sleepTrend().avgScore()).isNotNull();
        assertThat(overview.sleepTrend().avgDurationSeconds()).isNotNull();

        assertThat(overview.stressTrend().current()).isNotNull();
        assertThat(overview.stressTrend().avg()).isNotNull();

        assertThat(overview.restingHrTrend().current()).isNotNull();
        assertThat(overview.restingHrTrend().avg()).isNotNull();
    }

    // --- getRecoveryStatus tests ---

    @Test
    void getRecoveryStatusWithNoData_returnsZeroScoreAndBrakDanych() {
        when(dailySummaryRepository.findByDateRange(any(DateRange.class))).thenReturn(List.of());

        HealthService.RecoveryStatus status = healthService.getRecoveryStatus(LocalDate.of(2024, 6, 7));

        assertThat(status.score()).isZero();
        assertThat(status.level()).isEqualTo("brak danych");
        assertThat(status.description()).contains("Brak danych");
        assertThat(status.alerts()).isEmpty();
    }

    @Test
    void getRecoveryStatusHighRecovery_goodMetricsYieldHighScore() {
        List<DailySummary> data = buildHighRecoveryData();
        when(dailySummaryRepository.findByDateRange(any(DateRange.class))).thenReturn(data);

        HealthService.RecoveryStatus status = healthService.getRecoveryStatus(LocalDate.of(2024, 6, 7));

        assertThat(status.score()).isGreaterThanOrEqualTo(70);
        assertThat(status.level()).isIn("pełna regeneracja", "dobra regeneracja");
    }

    @Test
    void getRecoveryStatusLowRecovery_poorMetricsYieldLowScore() {
        List<DailySummary> data = buildLowRecoveryData();
        when(dailySummaryRepository.findByDateRange(any(DateRange.class))).thenReturn(data);

        HealthService.RecoveryStatus status = healthService.getRecoveryStatus(LocalDate.of(2024, 6, 7));

        assertThat(status.score()).isLessThanOrEqualTo(40);
        assertThat(status.level()).isIn("umiarkowane zmęczenie", "duże zmęczenie", "wyczerpanie");
    }

    // --- detectAlerts tests ---

    @Test
    void detectAlertsTriggersOnDecliningHrv() {
        List<DailySummary> data = buildDecliningHrvData();
        DailySummary latest = data.getLast();

        List<String> alerts = healthService.detectAlerts(data, latest);

        assertThat(alerts).anyMatch(a -> a.contains("HRV poniżej 80%"));
    }

    @Test
    void detectAlertsTriggersOnHighStress() {
        DailySummary latest = dailySummary(LocalDate.of(2024, 6, 7))
                .stressAvg((short) 75)
                .garminSyncedAt(Instant.now())
                .build();

        List<String> alerts = healthService.detectAlerts(List.of(latest), latest);

        assertThat(alerts).anyMatch(a -> a.contains("Wysoki poziom stresu"));
    }

    @Test
    void detectAlertsTriggersOnPoorSleep() {
        DailySummary latest = dailySummary(LocalDate.of(2024, 6, 7))
                .sleepScore((short) 30)
                .garminSyncedAt(Instant.now())
                .build();

        List<String> alerts = healthService.detectAlerts(List.of(latest), latest);

        assertThat(alerts).anyMatch(a -> a.contains("Niska jakość snu"));
    }

    @Test
    void detectAlertsTriggersOnLowBodyBattery() {
        DailySummary latest = dailySummary(LocalDate.of(2024, 6, 7))
                .bodyBattery((short) 15)
                .garminSyncedAt(Instant.now())
                .build();

        List<String> alerts = healthService.detectAlerts(List.of(latest), latest);

        assertThat(alerts).anyMatch(a -> a.contains("Niski Body Battery"));
    }

    // --- getHealthTimeline tests ---

    @Test
    void getHealthTimelineFiltersNonGarminData() {
        DailySummary withGarmin = dailySummary(LocalDate.of(2024, 6, 1))
                .garminSyncedAt(Instant.now())
                .restingHrBpm((short) 55)
                .build();
        DailySummary withoutGarmin = dailySummary(LocalDate.of(2024, 6, 2))
                .garminSyncedAt(null)
                .restingHrBpm((short) 60)
                .build();
        DailySummary withGarmin2 = dailySummary(LocalDate.of(2024, 6, 3))
                .garminSyncedAt(Instant.now())
                .restingHrBpm((short) 58)
                .build();

        when(dailySummaryRepository.findByDateRange(any(DateRange.class)))
                .thenReturn(List.of(withGarmin, withoutGarmin, withGarmin2));

        List<HealthService.HealthDay> timeline = healthService.getHealthTimeline(
                LocalDate.of(2024, 6, 1), LocalDate.of(2024, 6, 3));

        assertThat(timeline).hasSize(2);
        assertThat(timeline.get(0).date()).isEqualTo(LocalDate.of(2024, 6, 1));
        assertThat(timeline.get(1).date()).isEqualTo(LocalDate.of(2024, 6, 3));
    }

    @Test
    void getHealthTimelineReturnsSortedByDate() {
        DailySummary day3 = dailySummary(LocalDate.of(2024, 6, 3))
                .garminSyncedAt(Instant.now()).build();
        DailySummary day1 = dailySummary(LocalDate.of(2024, 6, 1))
                .garminSyncedAt(Instant.now()).build();
        DailySummary day2 = dailySummary(LocalDate.of(2024, 6, 2))
                .garminSyncedAt(Instant.now()).build();

        when(dailySummaryRepository.findByDateRange(any(DateRange.class)))
                .thenReturn(List.of(day3, day1, day2));

        List<HealthService.HealthDay> timeline = healthService.getHealthTimeline(
                LocalDate.of(2024, 6, 1), LocalDate.of(2024, 6, 3));

        assertThat(timeline).hasSize(3);
        assertThat(timeline.get(0).date()).isEqualTo(LocalDate.of(2024, 6, 1));
        assertThat(timeline.get(1).date()).isEqualTo(LocalDate.of(2024, 6, 2));
        assertThat(timeline.get(2).date()).isEqualTo(LocalDate.of(2024, 6, 3));
    }

    // --- Test data builders ---

    private DailySummary.DailySummaryBuilder dailySummary(LocalDate date) {
        return DailySummary.builder().date(date);
    }

    private List<DailySummary> build7DaysOfHealthData() {
        List<DailySummary> data = new ArrayList<>();
        for (int i = 1; i <= 7; i++) {
            data.add(DailySummary.builder()
                    .date(LocalDate.of(2024, 6, i))
                    .restingHrBpm((short) (50 + i))
                    .hrvRmssd(BigDecimal.valueOf(40 + i * 2))
                    .sleepScore((short) (70 + i * 2))
                    .sleepDurationSeconds(25200 + i * 600)
                    .deepSleepSeconds(5400 + i * 100)
                    .lightSleepSeconds(10800 + i * 100)
                    .remSleepSeconds(5400 + i * 50)
                    .awakeSleepSeconds(1800 + i * 50)
                    .bodyBattery((short) (60 + i * 3))
                    .stressAvg((short) (30 + i))
                    .steps(8000 + i * 500)
                    .activeCalories(400 + i * 50)
                    .garminSyncedAt(Instant.now())
                    .build());
        }
        return data;
    }

    private List<DailySummary> buildHighRecoveryData() {
        List<DailySummary> data = new ArrayList<>();
        for (int i = 1; i <= 7; i++) {
            data.add(DailySummary.builder()
                    .date(LocalDate.of(2024, 6, i))
                    .hrvRmssd(BigDecimal.valueOf(55 + i))
                    .sleepScore((short) 85)
                    .stressAvg((short) 20)
                    .bodyBattery((short) 80)
                    .garminSyncedAt(Instant.now())
                    .build());
        }
        return data;
    }

    private List<DailySummary> buildLowRecoveryData() {
        List<DailySummary> data = new ArrayList<>();
        for (int i = 1; i <= 7; i++) {
            data.add(DailySummary.builder()
                    .date(LocalDate.of(2024, 6, i))
                    .hrvRmssd(BigDecimal.valueOf(50 - i * 5))
                    .sleepScore((short) 35)
                    .stressAvg((short) 80)
                    .bodyBattery((short) 15)
                    .garminSyncedAt(Instant.now())
                    .build());
        }
        return data;
    }

    private List<DailySummary> buildDecliningHrvData() {
        List<DailySummary> data = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            data.add(DailySummary.builder()
                    .date(LocalDate.of(2024, 6, i))
                    .hrvRmssd(BigDecimal.valueOf(60))
                    .garminSyncedAt(Instant.now())
                    .build());
        }
        // Latest day has HRV well below 80% of average (60 * 0.8 = 48)
        data.add(DailySummary.builder()
                .date(LocalDate.of(2024, 6, 6))
                .hrvRmssd(BigDecimal.valueOf(30))
                .garminSyncedAt(Instant.now())
                .build());
        return data;
    }
}
