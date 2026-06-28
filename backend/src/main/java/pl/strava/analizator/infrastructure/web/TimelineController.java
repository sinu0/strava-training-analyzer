package pl.strava.analizator.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.TimelineService;

@RestController
@RequestMapping("/api/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTimeline(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String type) {
        if (from == null) from = LocalDate.now().minusMonths(6);
        if (to == null) to = LocalDate.now();
        return ResponseEntity.ok(timelineService.getTimeline(from, to, type));
    }
}
