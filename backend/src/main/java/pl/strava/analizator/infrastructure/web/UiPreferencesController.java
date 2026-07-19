package pl.strava.analizator.infrastructure.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.UiPreferencesService;
import pl.strava.analizator.application.dto.UiPreferencesDto;

@RestController
@RequestMapping("/api/v2/ui-preferences")
@RequiredArgsConstructor
public class UiPreferencesController {

    private final UiPreferencesService service;

    @GetMapping
    public UiPreferencesDto getPreferences() {
        return service.getPreferences();
    }

    @PutMapping
    public UiPreferencesDto updatePreferences(@RequestBody UiPreferencesDto request) {
        return service.updatePreferences(request);
    }
}
