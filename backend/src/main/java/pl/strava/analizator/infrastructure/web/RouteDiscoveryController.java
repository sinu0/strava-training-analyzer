package pl.strava.analizator.infrastructure.web;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.RouteDiscoveryService;

@RestController
@RequestMapping("/api/discover")
@RequiredArgsConstructor
public class RouteDiscoveryController {

    private final RouteDiscoveryService discoveryService;

    @GetMapping("/discover")
    public ResponseEntity<List<Map<String, Object>>> getUnexploredDirections() {
        return ResponseEntity.ok(discoveryService.getUnexploredDirections());
    }
}
