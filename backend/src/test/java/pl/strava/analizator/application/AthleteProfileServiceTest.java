package pl.strava.analizator.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.TrainingZone;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.TrainingZoneRepository;

@ExtendWith(MockitoExtension.class)
class AthleteProfileServiceTest {

    @Mock
    private AthleteProfileRepository profileRepository;

    @Mock
    private TrainingZoneRepository trainingZoneRepository;

    @InjectMocks
    private AthleteProfileService athleteProfileService;

    @Test
    void getProfileIncludesCurrentZones() {
        AthleteProfile profile = AthleteProfile.builder()
                .id(UUID.randomUUID())
                .name("Jan Kowalski")
                .ftpWatts((short) 285)
                .lthrBpm((short) 172)
                .weightKg(BigDecimal.valueOf(74.8))
                .stravaAthleteId(12345L)
                .stravaAccessToken("token")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        TrainingZone zone = TrainingZone.builder()
                .id(UUID.randomUUID())
                .zoneType("power")
                .zoneNumber((short) 3)
                .zoneName("Tempo")
                .minValue((short) 211)
                .maxValue((short) 255)
                .color("#3FB950")
                .validFrom(LocalDate.now())
                .build();

        when(profileRepository.findFirst()).thenReturn(Optional.of(profile));
        when(trainingZoneRepository.findCurrentZones(LocalDate.now())).thenReturn(List.of(zone));

        var result = athleteProfileService.getProfile();

        assertThat(result.getCurrentZones()).hasSize(1);
        assertThat(result.getCurrentZones().get(0).getZoneType()).isEqualTo("power");
        assertThat(result.getCurrentZones().get(0).getZoneNumber()).isEqualTo((short) 3);
        assertThat(result.isStravaConnected()).isTrue();
    }
}