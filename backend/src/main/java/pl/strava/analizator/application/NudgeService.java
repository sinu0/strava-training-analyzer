package pl.strava.analizator.application;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.NudgeDto;
import pl.strava.analizator.domain.port.ActivityRepository;

@Service
@RequiredArgsConstructor
public class NudgeService {

    private final ActivityRepository activityRepository;
    private final JournalService journalService;
    private final ChallengeService challengeService;
    private final StreakService streakService;

    public List<NudgeDto> getPendingNudges() {
        List<NudgeDto> nudges = new ArrayList<>();

        checkMorningCheckin(nudges);
        checkStreakAtRisk(nudges);
        checkChallengeProgress(nudges);
        checkRecoveryReminder(nudges);

        return nudges;
    }

    private void checkMorningCheckin(List<NudgeDto> nudges) {
        var latest = journalService.getLatestEntry();
        if (latest == null || !latest.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate().equals(LocalDate.now())) {
            nudges.add(NudgeDto.builder()
                    .id(UUID.randomUUID().toString())
                    .type("MORNING_CHECKIN")
                    .title("Poranny check-in")
                    .message("Jak się dziś czujesz? Zrób poranny check-in — pomoże to lepiej dobrać trening.")
                    .severity("info")
                    .actionUrl("/")
                    .build());
        }
    }

    private void checkStreakAtRisk(List<NudgeDto> nudges) {
        var stats = streakService.getStreakStats();
        int currentStreak = ((Number) stats.get("currentStreak")).intValue();
        if (currentStreak >= 3) {
            var activities = activityRepository.findAll();
            var latestActivityDate = activities.stream()
                    .filter(a -> a.getStartedAt() != null)
                    .map(a -> a.getStartedAt().toLocalDate())
                    .max(LocalDate::compareTo)
                    .orElse(null);

            if (latestActivityDate != null) {
                long daysSince = java.time.temporal.ChronoUnit.DAYS.between(latestActivityDate, LocalDate.now());
                if (daysSince >= 2) {
                    nudges.add(NudgeDto.builder()
                            .id(UUID.randomUUID().toString())
                            .type("STREAK_AT_RISK")
                            .title("Seria zagrożona!")
                            .message(String.format("Twoja seria %d dni jest zagrożona — nie jeździłeś od %d dni.", currentStreak, daysSince))
                            .severity("warning")
                            .actionUrl("/")
                            .build());
                }
            }
        }
    }

    private void checkChallengeProgress(List<NudgeDto> nudges) {
        var challenges = challengeService.getActiveChallenges();
        for (var ch : challenges) {
            if (ch.getProgressPercent() >= 75 && ch.getDaysLeft() <= 7 && ch.getDaysLeft() > 0) {
                nudges.add(NudgeDto.builder()
                        .id(UUID.randomUUID().toString())
                        .type("CHALLENGE_PROGRESS")
                        .title("Wyzwanie prawie ukończone!")
                        .message(String.format("\"%s\" — %.0f%% gotowe, zostało %d dni. Dociśnij!",
                                ch.getName(), ch.getProgressPercent(), ch.getDaysLeft()))
                        .severity("success")
                        .actionUrl("/")
                        .data(Map.of("challengeId", ch.getId().toString()))
                        .build());
            }
        }
    }

    private void checkRecoveryReminder(List<NudgeDto> nudges) {
        var activities = activityRepository.findByStartedAtBetween(
                java.time.OffsetDateTime.now(ZoneOffset.UTC).minusDays(3),
                java.time.OffsetDateTime.now(ZoneOffset.UTC));

        long highIntensityCount = activities.stream()
                .filter(a -> a.getAvgPowerW() != null && a.getAvgPowerW() > 200)
                .count();

        if (highIntensityCount >= 3) {
            nudges.add(NudgeDto.builder()
                    .id(UUID.randomUUID().toString())
                    .type("RECOVERY_REMINDER")
                    .title("Czas na regenerację")
                    .message("3 dni z wysoką intensywnością. Rozważ dzień recovery lub lekkiej jazdy.")
                    .severity("warning")
                    .actionUrl("/")
                    .build());
        }
    }
}
