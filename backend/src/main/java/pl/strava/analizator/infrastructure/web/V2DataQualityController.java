package pl.strava.analizator.infrastructure.web;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ActivityDataQualityService;
import pl.strava.analizator.application.dto.ActivityDataQualityDto;
import pl.strava.analizator.application.dto.DataQualitySummaryDto;

@RestController
@RequestMapping("/api/v2/data-quality")
@RequiredArgsConstructor
public class V2DataQualityController {
    private final ActivityDataQualityService dataQualityService;

    @GetMapping("/summary")
    public DataQualitySummaryDto summary() { return dataQualityService.summary(); }

    @GetMapping("/activities/{id}")
    public ActivityDataQualityDto activity(@PathVariable UUID id) { return dataQualityService.get(id); }
}
