package pl.strava.analizator.infrastructure.web;

import java.time.Clock;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.format.annotation.DateTimeFormat;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.TrainingPreferencesService;
import pl.strava.analizator.application.WeeklyReviewService;
import pl.strava.analizator.application.dto.TrainingContextDto;
import pl.strava.analizator.application.dto.WeeklyReviewDto;

@RestController @RequestMapping("/api/v2/training") @RequiredArgsConstructor
public class TrainingContextController {
    private final TrainingPreferencesService preferences;
    private final WeeklyReviewService reviews;
    private final TrainingContextMapper mapper;
    private final Clock clock;

    @GetMapping("/context") public TrainingContextDto get() {
        var dto = mapper.toDto(preferences.get());
        dto.setTimezone(clock.getZone().getId());
        dto.setAsOf(LocalDate.now(clock));
        return dto;
    }

    @PutMapping("/context") public TrainingContextDto save(@RequestBody TrainingContextDto dto) {
        preferences.save(mapper.toDomain(dto));
        return get();
    }

    @GetMapping("/weekly-review") public WeeklyReviewDto review(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from) {
        return reviews.review(from != null ? from : LocalDate.now(clock).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)));
    }
}
