package pl.strava.analizator.infrastructure.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.PersonalRecordService;
import pl.strava.analizator.application.dto.PersonalRecordDto;
import pl.strava.analizator.domain.gamification.PersonalRecordType;

@RestController
@RequestMapping("/api/personal-records")
@RequiredArgsConstructor
public class PersonalRecordController {

    private final PersonalRecordService recordService;

    private static final java.util.Map<PersonalRecordType, String[]> LABELS = java.util.Map.ofEntries(
            java.util.Map.entry(PersonalRecordType.BEST_5S_POWER, new String[]{"5s Power", "W"}),
            java.util.Map.entry(PersonalRecordType.BEST_1MIN_POWER, new String[]{"1min Power", "W"}),
            java.util.Map.entry(PersonalRecordType.BEST_5MIN_POWER, new String[]{"5min Power", "W"}),
            java.util.Map.entry(PersonalRecordType.BEST_20MIN_POWER, new String[]{"20min Power", "W"}),
            java.util.Map.entry(PersonalRecordType.LONGEST_RIDE, new String[]{"Najdłuższa jazda", "km"}),
            java.util.Map.entry(PersonalRecordType.MOST_ELEVATION_SINGLE, new String[]{"Najwięcej przewyższenia", "m"}),
            java.util.Map.entry(PersonalRecordType.MOST_ELEVATION_WEEK, new String[]{"Przewyższenie w tygodniu", "m"}),
            java.util.Map.entry(PersonalRecordType.FASTEST_AVG_SPEED, new String[]{"Najszybsza średnia", "km/h"}),
            java.util.Map.entry(PersonalRecordType.FASTEST_40KM, new String[]{"Najszybsze 40km", "km/h"}),
            java.util.Map.entry(PersonalRecordType.LONGEST_DURATION, new String[]{"Najdłuższy czas", "min"}),
            java.util.Map.entry(PersonalRecordType.MOST_WEEKLY_HOURS, new String[]{"Najwięcej godzin/tydz.", "h"}),
            java.util.Map.entry(PersonalRecordType.LONGEST_STREAK_DAYS, new String[]{"Seria dni", "dni"}),
            java.util.Map.entry(PersonalRecordType.LONGEST_STREAK_WEEKS, new String[]{"Seria tygodni", "tyg."}),
            java.util.Map.entry(PersonalRecordType.HIGHEST_TSS_SESSION, new String[]{"Najwyższy TSS", "TSS"})
    );

    @GetMapping
    public ResponseEntity<List<PersonalRecordDto>> getAllRecords() {
        return ResponseEntity.ok(recordService.getAllRecords().stream().map(this::toDto).toList());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<PersonalRecordDto>> getRecentRecords(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(recordService.getRecentRecords(days).stream().map(this::toDto).toList());
    }

    @PostMapping("/detect")
    public ResponseEntity<List<PersonalRecordDto>> detectNewRecords() {
        return ResponseEntity.ok(recordService.detectNewRecords().stream().map(this::toDto).toList());
    }

    private PersonalRecordDto toDto(pl.strava.analizator.domain.gamification.PersonalRecord rec) {
        var labelInfo = LABELS.getOrDefault(rec.getRecordType(), new String[]{rec.getRecordType().name(), ""});
        return PersonalRecordDto.builder()
                .id(rec.getId())
                .recordType(rec.getRecordType().name())
                .recordValue(rec.getRecordValue())
                .activityId(rec.getActivityId())
                .achievedAt(rec.getAchievedAt())
                .previousValue(rec.getPreviousValue())
                .improvementPercent(rec.getImprovementPercent())
                .label(labelInfo[0])
                .unit(labelInfo[1])
                .build();
    }
}
