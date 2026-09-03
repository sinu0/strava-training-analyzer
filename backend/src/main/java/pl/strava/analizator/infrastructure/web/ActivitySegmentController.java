package pl.strava.analizator.infrastructure.web;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.SegmentAnalysisService;
import pl.strava.analizator.application.dto.ActivitySegmentsDto;

@RestController
@RequestMapping("/api/v2/activities")
@RequiredArgsConstructor
public class ActivitySegmentController {
    private final SegmentAnalysisService service;

    @GetMapping("/{id}/segments")
    public ActivitySegmentsDto findSegments(@PathVariable UUID id) { return service.findActivitySegments(id); }
}
