package pl.strava.analizator.infrastructure.web;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.SeasonWrappedService;

@RestController
@RequestMapping("/api/season-wrapped")
@RequiredArgsConstructor
public class SeasonWrappedController {

    private final SeasonWrappedService seasonWrappedService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getWrapped(@RequestParam(defaultValue = "2026") int year) {
        return ResponseEntity.ok(seasonWrappedService.generate(year));
    }

    @GetMapping("/years")
    public ResponseEntity<List<Integer>> getAvailableYears() {
        return ResponseEntity.ok(seasonWrappedService.getAvailableYears());
    }
}
