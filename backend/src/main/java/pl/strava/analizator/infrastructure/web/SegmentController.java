package pl.strava.analizator.infrastructure.web;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.SegmentAnalysisService;
import pl.strava.analizator.application.dto.SegmentComparisonDto;
import pl.strava.analizator.application.dto.SegmentDetailDto;
import pl.strava.analizator.application.dto.SegmentEffortDto;
import pl.strava.analizator.application.dto.SegmentPageDto;
import pl.strava.analizator.application.dto.SegmentSummaryDto;
import pl.strava.analizator.application.dto.UpdateSegmentFavoriteRequest;

@RestController
@RequestMapping("/api/v2/segments")
@RequiredArgsConstructor
public class SegmentController {
    private final SegmentAnalysisService service;

    @GetMapping
    public SegmentPageDto findSegments(@RequestParam(required = false) String q,
                                       @RequestParam(required = false) Boolean favorite,
                                       @RequestParam(required = false) BigDecimal minDistanceM,
                                       @RequestParam(required = false) BigDecimal maxDistanceM,
                                       @RequestParam(required = false) BigDecimal minAverageGrade,
                                       @RequestParam(defaultValue = "recent") String sort,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "30") int size) {
        return service.findSegments(q, favorite, minDistanceM, maxDistanceM, minAverageGrade, sort, page, size);
    }

    @GetMapping("/{id}")
    public SegmentDetailDto findSegment(@PathVariable long id) { return service.findSegment(id); }

    @GetMapping("/{id}/efforts")
    public List<SegmentEffortDto> findEfforts(@PathVariable long id) { return service.findSegmentEfforts(id); }

    @PatchMapping("/{id}/favorite")
    public SegmentSummaryDto setFavorite(@PathVariable long id, @RequestBody UpdateSegmentFavoriteRequest request) {
        return service.setFavorite(id, request.isFavorite());
    }

    @GetMapping("/{id}/comparison")
    public SegmentComparisonDto compare(@PathVariable long id,
                                        @RequestParam List<UUID> effortIds,
                                        @RequestParam(required = false) UUID referenceEffortId) {
        return service.compare(id, effortIds, referenceEffortId);
    }
}
