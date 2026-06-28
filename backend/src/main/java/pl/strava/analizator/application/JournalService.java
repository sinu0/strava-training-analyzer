package pl.strava.analizator.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.JournalEntryDto;
import pl.strava.analizator.application.dto.MoodCorrelationDto;
import pl.strava.analizator.application.dto.SaveJournalEntryRequest;
import pl.strava.analizator.domain.journal.JournalEntry;
import pl.strava.analizator.domain.journal.JournalMood;
import pl.strava.analizator.domain.journal.JournalRepository;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;

@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalRepository journalRepository;
    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository metricRepository;

    public List<JournalEntryDto> getEntries(LocalDate from, LocalDate to) {
        return journalRepository.findByDateRange(from, to).stream()
                .map(this::toDto)
                .toList();
    }

    public JournalEntryDto getByActivityId(UUID activityId) {
        return journalRepository.findByActivityId(activityId)
                .map(this::toDto)
                .orElse(null);
    }

    public List<JournalEntryDto> getRecent(int limit) {
        return journalRepository.findRecent(limit).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public JournalEntryDto save(SaveJournalEntryRequest request) {
        JournalMood mood = JournalMood.valueOf(request.getMood().toUpperCase());
        Instant now = Instant.now();

        var existing = journalRepository.findByActivityId(request.getActivityId());
        JournalEntry entry;
        if (existing.isPresent()) {
            entry = JournalEntry.builder()
                    .id(existing.get().getId())
                    .activityId(request.getActivityId())
                    .mood(mood)
                    .note(request.getNote())
                    .tags(request.getTags() != null ? request.getTags() : List.of())
                    .createdAt(existing.get().getCreatedAt())
                    .updatedAt(now)
                    .build();
        } else {
            entry = JournalEntry.builder()
                    .activityId(request.getActivityId())
                    .mood(mood)
                    .note(request.getNote())
                    .tags(request.getTags() != null ? request.getTags() : List.of())
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
        }

        return toDto(journalRepository.save(entry));
    }

    @Transactional(readOnly = true)
    public MoodCorrelationDto getMoodCorrelation() {
        var entries = journalRepository.findRecent(200);
        if (entries.isEmpty()) {
            return MoodCorrelationDto.builder()
                    .totalEntries(0)
                    .byMood(Map.of())
                    .build();
        }

        List<UUID> activityIds = entries.stream()
                .map(JournalEntry::getActivityId)
                .toList();

        Map<UUID, JournalMood> moodByActivity = entries.stream()
                .collect(Collectors.toMap(JournalEntry::getActivityId, JournalEntry::getMood));

        Map<UUID, Activity> activities = activityIds.stream()
                .map(activityRepository::findById)
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .collect(Collectors.toMap(Activity::getId, a -> a));

        Map<UUID, BigDecimal> tssByActivity = metricRepository.findNumericValues(activityIds, "TSS");

        Map<String, MoodCorrelationDto.MoodMetric> byMood = new java.util.LinkedHashMap<>();

        for (JournalMood mood : JournalMood.values()) {
            var entriesForMood = entries.stream()
                    .filter(e -> e.getMood() == mood)
                    .toList();

            if (entriesForMood.isEmpty()) continue;

            double totalPower = 0;
            double totalHr = 0;
            double totalTss = 0;
            double totalDuration = 0;
            double totalDistance = 0;
            int count = 0;

            for (var e : entriesForMood) {
                var activity = activities.get(e.getActivityId());
                if (activity == null) continue;

                if (activity.getAvgPowerW() != null) totalPower += activity.getAvgPowerW();
                if (activity.getAvgHeartrate() != null) totalHr += activity.getAvgHeartrate();
                if (activity.getMovingTimeSec() != null) totalDuration += activity.getMovingTimeSec() / 60.0;
                if (activity.getDistanceM() != null) totalDistance += activity.getDistanceM().doubleValue() / 1000.0;

                var tss = tssByActivity.get(e.getActivityId());
                if (tss != null) totalTss += tss.doubleValue();

                count++;
            }

            if (count > 0) {
                byMood.put(mood.name(), MoodCorrelationDto.MoodMetric.builder()
                        .count(count)
                        .avgPower(totalPower > 0 ? round(totalPower / count) : null)
                        .avgHeartRate(totalHr > 0 ? round(totalHr / count) : null)
                        .avgTss(totalTss > 0 ? round(totalTss / count) : null)
                        .avgDurationMinutes(totalDuration > 0 ? round(totalDuration / count) : null)
                        .avgDistanceKm(totalDistance > 0 ? round(totalDistance / count) : null)
                        .build());
            }
        }

        return MoodCorrelationDto.builder()
                .totalEntries(entries.size())
                .byMood(byMood)
                .build();
    }

    @Transactional
    public void deleteById(UUID id) {
        journalRepository.deleteById(id);
    }

    public String getJournalContextForAi(int daysBack) {
        var entries = journalRepository.findByDateRange(
                LocalDate.now().minusDays(daysBack), LocalDate.now());

        if (entries.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        for (var e : entries) {
            sb.append(e.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate())
                    .append(" [").append(e.getMood()).append("]");
            if (e.getNote() != null && !e.getNote().isBlank()) {
                sb.append(" '").append(e.getNote()).append("'");
            }
            if (e.getTags() != null && !e.getTags().isEmpty()) {
                sb.append(" #").append(String.join(" #", e.getTags()));
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    public String getJournalMoodTrend(int daysBack) {
        var entries = journalRepository.findByDateRange(
                LocalDate.now().minusDays(daysBack), LocalDate.now());

        if (entries.isEmpty()) return "No journal data available.";

        long great = entries.stream().filter(e -> e.getMood() == JournalMood.GREAT).count();
        long good = entries.stream().filter(e -> e.getMood() == JournalMood.GOOD).count();
        long ok = entries.stream().filter(e -> e.getMood() == JournalMood.OK).count();
        long tired = entries.stream().filter(e -> e.getMood() == JournalMood.TIRED).count();
        long bad = entries.stream().filter(e -> e.getMood() == JournalMood.BAD).count();

        return String.format("GREAT:%d GOOD:%d OK:%d TIRED:%d BAD:%d", great, good, ok, tired, bad);
    }

    public JournalEntryDto getLatestEntry() {
        var entries = journalRepository.findRecent(1);
        return entries.isEmpty() ? null : toDto(entries.get(0));
    }

    private JournalEntryDto toDto(JournalEntry entry) {
        return JournalEntryDto.builder()
                .id(entry.getId())
                .activityId(entry.getActivityId())
                .mood(entry.getMood() != null ? entry.getMood().name() : null)
                .note(entry.getNote())
                .tags(entry.getTags())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    private double round(double value) {
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
