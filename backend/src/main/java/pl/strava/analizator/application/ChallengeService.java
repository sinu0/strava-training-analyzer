package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import pl.strava.analizator.application.dto.ChallengeDto;
import pl.strava.analizator.application.dto.SaveChallengeRequest;
import pl.strava.analizator.domain.challenge.Challenge;
import pl.strava.analizator.domain.challenge.ChallengeStatus;
import pl.strava.analizator.domain.challenge.ChallengeType;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.ChallengeRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository metricRepository;

    public List<ChallengeDto> getAll() {
        return challengeRepository.findAll().stream()
                .sorted(Comparator.comparing(Challenge::getCreatedAt).reversed())
                .map(this::toDto)
                .toList();
    }

    public List<ChallengeDto> getActiveChallenges() {
        return challengeRepository.findByStatus("ACTIVE").stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ChallengeDto create(SaveChallengeRequest request) {
        ChallengeType type = ChallengeType.valueOf(request.getType().toUpperCase());
        Instant now = Instant.now();

        Challenge challenge = Challenge.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(type)
                .targetValue(request.getTargetValue())
                .targetUnit(request.getTargetUnit())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(ChallengeStatus.ACTIVE)
                .createdAt(now)
                .build();

        return toDto(challengeRepository.save(challenge));
    }

    @Transactional
    public ChallengeDto update(UUID id, SaveChallengeRequest request) {
        var existing = challengeRepository.findById(id).orElse(null);
        if (existing == null) return null;

        ChallengeType type = ChallengeType.valueOf(request.getType().toUpperCase());

        Challenge updated = Challenge.builder()
                .id(id)
                .name(request.getName())
                .description(request.getDescription())
                .type(type)
                .targetValue(request.getTargetValue())
                .targetUnit(request.getTargetUnit())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(existing.getStatus())
                .completedAt(existing.getCompletedAt())
                .createdAt(existing.getCreatedAt())
                .build();

        return toDto(challengeRepository.save(updated));
    }

    @Transactional
    public void delete(UUID id) {
        challengeRepository.deleteById(id);
    }

    @Transactional
    public void updateAllProgress() {
        var activeChallenges = challengeRepository.findByStatus("ACTIVE");
        if (activeChallenges.isEmpty()) return;

        List<Activity> activities = activityRepository.findAll();

        for (Challenge ch : activeChallenges) {
            double current = computeProgress(ch, activities);
            challengeRepository.updateProgress(ch.getId(), current);

            if (current >= ch.getTargetValue()) {
                Challenge completed = Challenge.builder()
                        .id(ch.getId())
                        .name(ch.getName())
                        .description(ch.getDescription())
                        .type(ch.getType())
                        .targetValue(ch.getTargetValue())
                        .targetUnit(ch.getTargetUnit())
                        .startDate(ch.getStartDate())
                        .endDate(ch.getEndDate())
                        .status(ChallengeStatus.COMPLETED)
                        .completedAt(Instant.now())
                        .createdAt(ch.getCreatedAt())
                        .build();
                challengeRepository.save(completed);
                log.info("Challenge completed: {}", ch.getName());
            } else if (LocalDate.now().isAfter(ch.getEndDate())) {
                Challenge failed = Challenge.builder()
                        .id(ch.getId())
                        .name(ch.getName())
                        .description(ch.getDescription())
                        .type(ch.getType())
                        .targetValue(ch.getTargetValue())
                        .targetUnit(ch.getTargetUnit())
                        .startDate(ch.getStartDate())
                        .endDate(ch.getEndDate())
                        .status(ChallengeStatus.FAILED)
                        .completedAt(ch.getCompletedAt())
                        .createdAt(ch.getCreatedAt())
                        .build();
                challengeRepository.save(failed);
            }
        }
    }

    public List<Map<String, Object>> getTemplates() {
        return List.of(
                Map.of(
                        "name", "500 km w miesiącu",
                        "description", "Przejedź 500 km w ciągu 30 dni",
                        "type", "DISTANCE", "targetValue", 500.0, "targetUnit", "KM"
                ),
                Map.of(
                        "name", "3 sesje progowe w tygodniu",
                        "description", "Wykonaj 3 treningi progowe (THRESHOLD) każdego tygodnia",
                        "type", "FREQUENCY", "targetValue", 12.0, "targetUnit", "SESSIONS"
                ),
                Map.of(
                        "name", "10 000 m przewyższenia",
                        "description", "Zdobądź 10 000 metrów przewyższenia w miesiącu",
                        "type", "ELEVATION", "targetValue", 10000.0, "targetUnit", "M"
                ),
                Map.of(
                        "name", "30 dni bez przerwy",
                        "description", "Jeździj codziennie przez 30 dni",
                        "type", "STREAK", "targetValue", 30.0, "targetUnit", "DAYS"
                ),
                Map.of(
                        "name", "2000 TSS w miesiącu",
                        "description", "Zbierz 2000 punktów TSS w ciągu 30 dni",
                        "type", "TSS", "targetValue", 2000.0, "targetUnit", "TSS"
                )
        );
    }

    private double computeProgress(Challenge challenge, List<Activity> activities) {
        var inRange = activities.stream()
                .filter(a -> a.getStartedAt() != null)
                .filter(a -> isInRange(a.getStartedAt().toLocalDate(), challenge.getStartDate(), challenge.getEndDate()))
                .toList();

        return switch (challenge.getType()) {
            case DISTANCE -> round(inRange.stream()
                    .mapToDouble(a -> toDouble(a.getDistanceM()) / 1000.0).sum());
            case ELEVATION -> round(inRange.stream()
                    .mapToDouble(a -> toDouble(a.getElevationGainM())).sum());
            case FREQUENCY -> inRange.size();
            case STREAK -> computeStreak(inRange);
            case TSS -> computeTss(inRange);
        };
    }

    private double computeStreak(List<Activity> inRange) {
        Set<LocalDate> days = inRange.stream()
                .map(a -> a.getStartedAt().toLocalDate())
                .collect(Collectors.toSet());
        var sorted = days.stream().sorted().toList();
        if (sorted.isEmpty()) return 0;
        int streak = 1, max = 1;
        for (int i = 1; i < sorted.size(); i++) {
            streak = sorted.get(i).minusDays(1).equals(sorted.get(i - 1)) ? streak + 1 : 1;
            if (streak > max) max = streak;
        }
        return max;
    }

    private double computeTss(List<Activity> inRange) {
        var ids = inRange.stream().map(Activity::getId).toList();
        var tssMap = metricRepository.findNumericValues(ids, "TSS");
        return round(inRange.stream()
                .mapToDouble(a -> tssMap.getOrDefault(a.getId(), BigDecimal.ZERO).doubleValue())
                .sum());
    }

    private boolean isInRange(LocalDate date, LocalDate start, LocalDate end) {
        return !date.isBefore(start) && !date.isAfter(end);
    }

    private double round(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    private double toDouble(BigDecimal v) {
        return v != null ? v.doubleValue() : 0.0;
    }

    private ChallengeDto toDto(Challenge ch) {
        double current = 0;
        var activities = activityRepository.findByStartedAtBetween(
                OffsetDateTime.of(ch.getStartDate().atStartOfDay(), ZoneOffset.UTC),
                OffsetDateTime.of(ch.getEndDate().plusDays(1).atStartOfDay(), ZoneOffset.UTC));
        current = computeProgress(ch, activities);

        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), ch.getEndDate());
        double progress = ch.getTargetValue() > 0 ? Math.min(100, Math.round(current / ch.getTargetValue() * 1000.0) / 10.0) : 0;

        return ChallengeDto.builder()
                .id(ch.getId())
                .name(ch.getName())
                .description(ch.getDescription())
                .type(ch.getType() != null ? ch.getType().name() : null)
                .targetValue(ch.getTargetValue())
                .targetUnit(ch.getTargetUnit())
                .startDate(ch.getStartDate())
                .endDate(ch.getEndDate())
                .status(ch.getStatus() != null ? ch.getStatus().name() : null)
                .currentValue(current)
                .progressPercent(progress)
                .daysLeft(Math.max(0, daysLeft))
                .completedAt(ch.getCompletedAt())
                .createdAt(ch.getCreatedAt())
                .build();
    }
}
