package pl.strava.analizator.infrastructure.web;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.V2ActivityService;
import pl.strava.analizator.application.dto.ActivityStreamsDto;
import pl.strava.analizator.application.dto.ActivitySummaryPageDto;
import pl.strava.analizator.application.dto.ActivityV2DetailDto;
import pl.strava.analizator.application.dto.LapDto;

@RestController
@RequestMapping("/api/v2/activities")
@RequiredArgsConstructor
public class V2ActivityController {

    private final V2ActivityService activityService;

    @GetMapping
    public ActivitySummaryPageDto findActivities(
            @RequestParam(required = false) String sportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return activityService.findActivities(sportType, from, to, page, size);
    }

    @GetMapping("/{id}")
    public ActivityV2DetailDto findActivity(@PathVariable UUID id) {
        return activityService.findActivity(id);
    }

    @GetMapping("/{id}/streams")
    public ActivityStreamsDto findStreams(
            @PathVariable UUID id,
            @RequestParam(required = false) String series,
            @RequestParam(defaultValue = "1000") String resolution) {
        return activityService.findStreams(id, series, resolution);
    }

    @GetMapping("/{id}/laps")
    public List<LapDto> findLaps(@PathVariable UUID id) {
        return activityService.findLaps(id);
    }
}
