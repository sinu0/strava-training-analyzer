package pl.strava.analizator.application;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.PersonalRecordRepository;
import pl.strava.analizator.domain.port.AchievementRepository;

@Service
@RequiredArgsConstructor
public class TimelineService {

    private final ActivityRepository activityRepository;
    private final PersonalRecordRepository personalRecordRepository;
    private final AchievementRepository achievementRepository;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTimeline(LocalDate from, LocalDate to, String type) {
        List<Map<String, Object>> events = new ArrayList<>();

        if (type == null || type.equals("activity")) {
            var activities = activityRepository.findByStartedAtBetween(
                    from.atStartOfDay(ZoneOffset.UTC).toOffsetDateTime(),
                    to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime());
            for (var a : activities) {
                if (a.getStartedAt() == null) continue;
                var event = new LinkedHashMap<String, Object>();
                event.put("date", a.getStartedAt().toLocalDate().toString());
                event.put("type", "ACTIVITY");
                event.put("title", a.getName());
                event.put("subtitle", String.format("%.1f km | %.0f m | %d min",
                        a.getDistanceM() != null ? a.getDistanceM().doubleValue() / 1000.0 : 0,
                        a.getElevationGainM() != null ? a.getElevationGainM().doubleValue() : 0,
                        a.getMovingTimeSec() != null ? a.getMovingTimeSec() / 60 : 0));
                event.put("color", "#58A6FF");
                event.put("link", "/activities/" + a.getId());
                events.add(event);
            }
        }

        if (type == null || type.equals("pr")) {
            var records = personalRecordRepository.findAll();
            for (var r : records) {
                var event = new LinkedHashMap<String, Object>();
                event.put("date", r.getAchievedAt().toString());
                event.put("type", "PR");
                event.put("title", r.getRecordType() != null ? r.getRecordType().name() : "PR");
                event.put("subtitle", String.format("%.1f (poprawiono o %.0f%%)",
                        r.getRecordValue(),
                        r.getImprovementPercent() != null ? r.getImprovementPercent() : 0));
                event.put("color", "#FF6B35");
                event.put("link", r.getActivityId() != null ? "/activities/" + r.getActivityId() : null);
                events.add(event);
            }
        }

        if (type == null || type.equals("achievement")) {
            var achievements = achievementRepository.findAll();
            for (var a : achievements) {
                if (!a.isUnlocked() || a.getUnlockedAt() == null) continue;
                var event = new LinkedHashMap<String, Object>();
                event.put("date", a.getUnlockedAt().toString());
                event.put("type", "ACHIEVEMENT");
                event.put("title", a.getName());
                event.put("subtitle", a.getDescription());
                event.put("color", "#9B7CFF");
                event.put("link", "/profile");
                events.add(event);
            }
        }

        events.sort(Comparator.<Map<String, Object>, String>comparing(e -> (String) e.get("date")).reversed());
        return events;
    }
}
