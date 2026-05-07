package pl.strava.analizator.application;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.dto.AthleteProfileDto;
import pl.strava.analizator.application.dto.TrainingZoneDto;
import pl.strava.analizator.application.dto.UpdateProfileRequest;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.TrainingZone;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.TrainingZoneRepository;

@Service
@RequiredArgsConstructor
public class AthleteProfileService {

    private final AthleteProfileRepository profileRepository;
    private final TrainingZoneRepository trainingZoneRepository;

    public AthleteProfileDto getProfile() {
        AthleteProfile profile = profileRepository.findFirst()
                .orElseThrow(() -> new ProfileNotFoundException("No athlete profile found"));
        return toDto(profile);
    }

    public AthleteProfileDto updateProfile(UpdateProfileRequest request) {
        AthleteProfile existing = profileRepository.findFirst()
                .orElseThrow(() -> new ProfileNotFoundException("No athlete profile found"));

        AthleteProfile updated = AthleteProfile.builder()
                .id(existing.getId())
                .name(request.getName() != null ? request.getName() : existing.getName())
                .email(existing.getEmail())
                .ftpWatts(request.getFtpWatts() != null ? request.getFtpWatts() : existing.getFtpWatts())
                .lthrBpm(request.getLthrBpm() != null ? request.getLthrBpm() : existing.getLthrBpm())
                .maxHrBpm(request.getMaxHrBpm() != null ? request.getMaxHrBpm() : existing.getMaxHrBpm())
                .restingHrBpm(request.getRestingHrBpm() != null ? request.getRestingHrBpm() : existing.getRestingHrBpm())
                .weightKg(request.getWeightKg() != null ? request.getWeightKg() : existing.getWeightKg())
                .dateOfBirth(request.getDateOfBirth() != null ? request.getDateOfBirth() : existing.getDateOfBirth())
                .stravaAthleteId(existing.getStravaAthleteId())
                .stravaAccessToken(existing.getStravaAccessToken())
                .stravaRefreshToken(existing.getStravaRefreshToken())
                .stravaTokenExpires(existing.getStravaTokenExpires())
                .createdAt(existing.getCreatedAt())
                .updatedAt(Instant.now())
                .build();

        return toDto(profileRepository.save(updated));
    }

    private AthleteProfileDto toDto(AthleteProfile profile) {
        List<TrainingZoneDto> currentZones = trainingZoneRepository.findCurrentZones(LocalDate.now()).stream()
            .map(this::toZoneDto)
            .toList();

        return AthleteProfileDto.builder()
                .id(profile.getId())
                .name(profile.getName())
                .email(profile.getEmail())
                .ftpWatts(profile.getFtpWatts())
                .lthrBpm(profile.getLthrBpm())
                .maxHrBpm(profile.getMaxHrBpm())
                .restingHrBpm(profile.getRestingHrBpm())
                .weightKg(profile.getWeightKg())
                .dateOfBirth(profile.getDateOfBirth())
                .stravaConnected(profile.hasStrava())
                .stravaAthleteId(profile.getStravaAthleteId())
                .currentZones(currentZones)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    private TrainingZoneDto toZoneDto(TrainingZone zone) {
        return TrainingZoneDto.builder()
                .id(zone.getId())
                .zoneType(zone.getZoneType())
                .zoneNumber(zone.getZoneNumber())
                .zoneName(zone.getZoneName())
                .minValue(zone.getMinValue())
                .maxValue(zone.getMaxValue())
                .color(zone.getColor())
                .validFrom(zone.getValidFrom())
                .validTo(zone.getValidTo())
                .build();
    }
}
