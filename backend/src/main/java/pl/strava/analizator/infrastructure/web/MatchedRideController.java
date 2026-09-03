package pl.strava.analizator.infrastructure.web;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.RouteMatchingService;
import pl.strava.analizator.application.dto.MatchedRideSummaryDto;
import pl.strava.analizator.application.dto.RouteGroupDetailDto;

@RestController
@RequestMapping("/api/v2/matched-rides")
@RequiredArgsConstructor
public class MatchedRideController {
    private final RouteMatchingService service;

    @GetMapping("/activity/{activityId}")
    public ResponseEntity<MatchedRideSummaryDto> findForActivity(@PathVariable UUID activityId) {
        return service.findForActivity(activityId).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{groupId}")
    public RouteGroupDetailDto findGroup(@PathVariable UUID groupId) { return service.findGroup(groupId); }
}
