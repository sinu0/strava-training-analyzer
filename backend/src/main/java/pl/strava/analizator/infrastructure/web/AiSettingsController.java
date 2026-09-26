package pl.strava.analizator.infrastructure.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ai.AiSettingsService;
import pl.strava.analizator.application.dto.AiSettingsDto;

@RestController
@RequestMapping("/api/v2/ai/settings")
@RequiredArgsConstructor
public class AiSettingsController {

    private final AiSettingsService service;

    @GetMapping
    public AiSettingsDto getSettings() {
        return service.getSettings();
    }

    @PutMapping
    public AiSettingsDto updateSettings(@RequestBody AiSettingsDto request) {
        return service.updateSettings(request);
    }
}
