package pl.strava.analizator.infrastructure.web;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.LoadScenarioService;
import pl.strava.analizator.application.dto.LoadScenarioDto;

@RestController
@RequestMapping("/api/v2/planning")
@RequiredArgsConstructor
public class V2PlanningController {

    private final LoadScenarioService loadScenarioService;

    @GetMapping("/load-scenario")
    public LoadScenarioDto loadScenario(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return loadScenarioService.calculate(from, to);
    }
}
