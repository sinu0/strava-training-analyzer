package pl.strava.analizator.infrastructure.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.AnalysisBackfillService;
import pl.strava.analizator.application.dto.BackfillStatusDto;

@RestController
@RequestMapping("/api/v2/analysis-data/backfill")
@RequiredArgsConstructor
public class AnalysisBackfillController {
    private final AnalysisBackfillService service;

    @GetMapping("/{type}")
    public BackfillStatusDto status(@PathVariable String type) { return service.status(type); }

    @PostMapping("/{type}")
    public BackfillStatusDto start(@PathVariable String type) { return service.start(type); }
}
