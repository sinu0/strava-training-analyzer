package pl.strava.analizator.application;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.strava.analizator.application.dto.WeightOverviewDto;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.WeightRecord;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.WeightRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WeightServiceCalibrationTest {

    @Mock private WeightRepository weightRepository;
    @Mock private AthleteProfileRepository profileRepository;
    @Mock private ActivityRepository activityRepository;

    private WeightService weightService;

    @BeforeEach
    void setUp() {
        weightService = new WeightService(weightRepository, profileRepository, activityRepository);
    }

    private WeightRecord makeRecord(LocalDate date, double kg) {
        return WeightRecord.builder()
                .id(UUID.randomUUID())
                .weightKg(BigDecimal.valueOf(kg))
                .recordedDate(date)
                .createdAt(Instant.now())
                .build();
    }

    private void stubNoActivities() {
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of());
    }

    @Test
    void getOverview_withNoTrainingData_usesBaseTdee() {
        WeightRecord latest = makeRecord(LocalDate.now(), 80.0);
        when(weightRepository.findLatest()).thenReturn(Optional.of(latest));
        when(weightRepository.findAllOrderByDate()).thenReturn(List.of(latest));
        when(weightRepository.findActiveGoal()).thenReturn(Optional.empty());
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        stubNoActivities();

        WeightOverviewDto result = weightService.getOverview();

        // BMR for 80kg, 178cm, 30y male = 10*80 + 6.25*178 - 5*30 + 5 = 800+1112.5-150+5 = 1767.5
        // TDEE sedentary = 1767.5 * 1.2 = 2121
        assertThat(result.getDailyCaloricNeed()).isNotNull();
        assertThat(result.getDailyCaloricNeed().intValue()).isBetween(2100, 2150);
    }

    @Test
    void getOverview_withTrainingCalories_addsTdee() {
        WeightRecord latest = makeRecord(LocalDate.now(), 80.0);
        when(weightRepository.findLatest()).thenReturn(Optional.of(latest));
        when(weightRepository.findAllOrderByDate()).thenReturn(List.of(latest));
        when(weightRepository.findActiveGoal()).thenReturn(Optional.empty());
        when(profileRepository.findFirst()).thenReturn(Optional.empty());

        // 2100 kcal from training in last 7 days → +300 kcal/day
        Activity a1 = Activity.builder().id(UUID.randomUUID()).calories(1050).build();
        Activity a2 = Activity.builder().id(UUID.randomUUID()).calories(1050).build();
        when(activityRepository.findByStartedAtBetween(any(), any())).thenReturn(List.of(a1, a2));

        WeightOverviewDto result = weightService.getOverview();

        // 2121 + 300 = 2421
        assertThat(result.getDailyCaloricNeed()).isNotNull();
        assertThat(result.getDailyCaloricNeed().intValue()).isBetween(2400, 2450);
    }

    @Test
    void getOverview_withSufficientData_setsHighConfidence() {
        LocalDate today = LocalDate.now();
        List<WeightRecord> records = List.of(
                makeRecord(today.minusDays(21), 82.0),
                makeRecord(today.minusDays(14), 81.5),
                makeRecord(today.minusDays(7), 81.0),
                makeRecord(today, 80.5)
        );
        when(weightRepository.findLatest()).thenReturn(Optional.of(records.get(3)));
        when(weightRepository.findAllOrderByDate()).thenReturn(records);
        when(weightRepository.findActiveGoal()).thenReturn(Optional.empty());
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        stubNoActivities();

        WeightOverviewDto result = weightService.getOverview();

        assertThat(result.getDataConfidence()).isEqualTo("wysoki");
    }

    @Test
    void getOverview_withFewMeasurements_setsLowConfidence() {
        WeightRecord latest = makeRecord(LocalDate.now(), 80.0);
        when(weightRepository.findLatest()).thenReturn(Optional.of(latest));
        when(weightRepository.findAllOrderByDate()).thenReturn(List.of(latest));
        when(weightRepository.findActiveGoal()).thenReturn(Optional.empty());
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        stubNoActivities();

        WeightOverviewDto result = weightService.getOverview();

        assertThat(result.getDataConfidence()).isEqualTo("niski");
    }

    @Test
    void getOverview_withWeeklyWeightChange_calculatesCorrectly() {
        LocalDate today = LocalDate.now();
        WeightRecord older = makeRecord(today.minusDays(7), 81.0);
        WeightRecord newer = makeRecord(today, 80.5);
        when(weightRepository.findLatest()).thenReturn(Optional.of(newer));
        when(weightRepository.findAllOrderByDate()).thenReturn(List.of(older, newer));
        when(weightRepository.findActiveGoal()).thenReturn(Optional.empty());
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        stubNoActivities();

        WeightOverviewDto result = weightService.getOverview();

        // -0.5 kg over 7 days = -0.5 kg/week
        assertThat(result.getWeeklyWeightChange()).isNotNull();
        assertThat(result.getWeeklyWeightChange().doubleValue()).isCloseTo(-0.5, org.assertj.core.data.Offset.offset(0.05));
    }
}
