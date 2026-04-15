package pl.strava.analizator.infrastructure.web;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.AthleteProfileService;
import pl.strava.analizator.application.dto.AthleteProfileDto;
import pl.strava.analizator.application.dto.UpdateProfileRequest;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class AthleteProfileController {

    private final AthleteProfileService profileService;

    @GetMapping
    public ResponseEntity<AthleteProfileDto> getProfile() {
        return ResponseEntity.ok(profileService.getProfile());
    }

    @PutMapping
    public ResponseEntity<AthleteProfileDto> updateProfile(
            @Validated @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(request));
    }
}
