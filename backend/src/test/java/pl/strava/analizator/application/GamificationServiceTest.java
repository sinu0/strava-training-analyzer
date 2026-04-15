package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.AchievementDto;
import pl.strava.analizator.domain.gamification.Achievement;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.port.AchievementRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;

@ExtendWith(MockitoExtension.class)
class GamificationServiceTest {

    @Mock
    private AchievementRepository achievementRepository;
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private AthleteProfileRepository profileRepository;

    private GamificationService service;

    @BeforeEach
    void setUp() {
        service = new GamificationService(achievementRepository, activityRepository, profileRepository);
    }

    @Test
    void getAchievements_returnsAllTenAchievements() {
        when(achievementRepository.findAll()).thenReturn(List.of());

        List<AchievementDto> result = service.getAchievements();

        assertThat(result).hasSize(10);
    }

    @Test
    void getAchievements_mergesStoredUnlockState() {
        Achievement stored = Achievement.builder()
                .id("weekly-100km")
                .name("old name")
                .unlocked(true)
                .unlockedAt(LocalDate.of(2024, 6, 1))
                .build();
        when(achievementRepository.findAll()).thenReturn(List.of(stored));

        List<AchievementDto> result = service.getAchievements();

        AchievementDto dto = result.stream().filter(a -> "weekly-100km".equals(a.getId())).findFirst().orElseThrow();
        assertThat(dto.isUnlocked()).isTrue();
        assertThat(dto.getUnlockedAt()).isEqualTo(LocalDate.of(2024, 6, 1));
        assertThat(dto.getName()).isEqualTo("Setka w tygodniu"); // definition name preserved
    }

    @Test
    void evaluateAll_unlocksWeekly100km_whenWeekHasAtLeast100km() {
        LocalDate monday = LocalDate.now().with(DayOfWeek.MONDAY);
        Activity activity = Activity.builder()
                .startedAt(monday.atStartOfDay().atOffset(ZoneOffset.UTC))
                .distanceM(BigDecimal.valueOf(110_000))
                .build();

        when(activityRepository.findAll()).thenReturn(List.of(activity));
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        when(achievementRepository.findById(anyString())).thenReturn(Optional.empty());
        when(achievementRepository.findAll()).thenReturn(List.of());

        service.evaluateAll();

        verify(achievementRepository).save(argThat(a -> "weekly-100km".equals(a.getId()) && a.isUnlocked()));
    }

    @Test
    void evaluateAll_doesNotUnlockWeekly100km_whenNoWeekReaches100km() {
        Activity activity = Activity.builder()
                .startedAt(LocalDate.now().atStartOfDay().atOffset(ZoneOffset.UTC))
                .distanceM(BigDecimal.valueOf(50_000))
                .build();

        when(activityRepository.findAll()).thenReturn(List.of(activity));
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        when(achievementRepository.findById(anyString())).thenReturn(Optional.empty());
        when(achievementRepository.findAll()).thenReturn(List.of());

        service.evaluateAll();

        verify(achievementRepository, never()).save(argThat(a -> "weekly-100km".equals(a.getId()) && a.isUnlocked()));
    }

    @Test
    void evaluateAll_unlocksFtp200_whenFtpAtLeast200() {
        when(activityRepository.findAll()).thenReturn(List.of());
        when(profileRepository.findFirst()).thenReturn(Optional.of(
                AthleteProfile.builder().ftpWatts((short) 210).build()));
        when(achievementRepository.findById(anyString())).thenReturn(Optional.empty());
        when(achievementRepository.findAll()).thenReturn(List.of());

        service.evaluateAll();

        verify(achievementRepository).save(argThat(a -> "ftp-200".equals(a.getId()) && a.isUnlocked()));
    }

    @Test
    void evaluateAll_doesNotUnlockFtp250_whenFtpBelow250() {
        when(activityRepository.findAll()).thenReturn(List.of());
        when(profileRepository.findFirst()).thenReturn(Optional.of(
                AthleteProfile.builder().ftpWatts((short) 240).build()));
        when(achievementRepository.findById(anyString())).thenReturn(Optional.empty());
        when(achievementRepository.findAll()).thenReturn(List.of());

        service.evaluateAll();

        verify(achievementRepository, never()).save(argThat(a -> "ftp-250".equals(a.getId()) && a.isUnlocked()));
    }

    @Test
    void evaluateAll_unlocksStreak7days_when7ConsecutiveDays() {
        LocalDate start = LocalDate.of(2024, 6, 3); // Monday
        List<Activity> activities = java.util.stream.IntStream.range(0, 7)
                .mapToObj(i -> Activity.builder()
                        .startedAt(start.plusDays(i).atStartOfDay().atOffset(ZoneOffset.UTC))
                        .build())
                .toList();

        when(activityRepository.findAll()).thenReturn(activities);
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        when(achievementRepository.findById(anyString())).thenReturn(Optional.empty());
        when(achievementRepository.findAll()).thenReturn(List.of());

        service.evaluateAll();

        verify(achievementRepository).save(argThat(a -> "streak-7days".equals(a.getId()) && a.isUnlocked()));
    }

    @Test
    void evaluateAll_doesNotUnlockStreak7days_whenLessThan7ConsecutiveDays() {
        LocalDate start = LocalDate.of(2024, 6, 3);
        List<Activity> activities = List.of(
                Activity.builder().startedAt(start.atStartOfDay().atOffset(ZoneOffset.UTC)).build(),
                Activity.builder().startedAt(start.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)).build(),
                Activity.builder().startedAt(start.plusDays(2).atStartOfDay().atOffset(ZoneOffset.UTC)).build(),
                Activity.builder().startedAt(start.plusDays(4).atStartOfDay().atOffset(ZoneOffset.UTC)).build(), // gap!
                Activity.builder().startedAt(start.plusDays(5).atStartOfDay().atOffset(ZoneOffset.UTC)).build(),
                Activity.builder().startedAt(start.plusDays(6).atStartOfDay().atOffset(ZoneOffset.UTC)).build()
        );

        when(activityRepository.findAll()).thenReturn(activities);
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        when(achievementRepository.findById(anyString())).thenReturn(Optional.empty());
        when(achievementRepository.findAll()).thenReturn(List.of());

        service.evaluateAll();

        verify(achievementRepository, never()).save(argThat(a -> "streak-7days".equals(a.getId()) && a.isUnlocked()));
    }

    @Test
    void evaluateAll_alreadyUnlockedAchievement_notSavedAgain() {
        Achievement alreadyUnlocked = Achievement.builder()
                .id("weekly-100km")
                .unlocked(true)
                .unlockedAt(LocalDate.now().minusDays(5))
                .build();

        LocalDate monday = LocalDate.now().with(DayOfWeek.MONDAY);
        Activity activity = Activity.builder()
                .startedAt(monday.atStartOfDay().atOffset(ZoneOffset.UTC))
                .distanceM(BigDecimal.valueOf(110_000))
                .build();

        when(activityRepository.findAll()).thenReturn(List.of(activity));
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        when(achievementRepository.findById(anyString())).thenReturn(Optional.empty());
        when(achievementRepository.findById("weekly-100km")).thenReturn(Optional.of(alreadyUnlocked));
        when(achievementRepository.findAll()).thenReturn(List.of(alreadyUnlocked));

        service.evaluateAll();

        verify(achievementRepository, never()).save(argThat(a -> "weekly-100km".equals(a.getId())));
    }

    @Test
    void evaluateAll_unlocksElevation10000m_whenTotalElevationSufficent() {
        LocalDate monday = LocalDate.now().with(DayOfWeek.MONDAY);
        Activity activity = Activity.builder()
                .startedAt(monday.atStartOfDay().atOffset(ZoneOffset.UTC))
                .elevationGainM(BigDecimal.valueOf(11_000))
                .build();

        when(activityRepository.findAll()).thenReturn(List.of(activity));
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        when(achievementRepository.findById(anyString())).thenReturn(Optional.empty());
        when(achievementRepository.findAll()).thenReturn(List.of());

        service.evaluateAll();

        verify(achievementRepository).save(argThat(a -> "elevation-10000m".equals(a.getId()) && a.isUnlocked()));
    }

    @Test
    void evaluateAll_returnsAllAchievements() {
        when(activityRepository.findAll()).thenReturn(List.of());
        when(profileRepository.findFirst()).thenReturn(Optional.empty());
        when(achievementRepository.findById(anyString())).thenReturn(Optional.empty());
        when(achievementRepository.findAll()).thenReturn(List.of());

        List<AchievementDto> result = service.evaluateAll();

        assertThat(result).hasSize(10);
    }
}
