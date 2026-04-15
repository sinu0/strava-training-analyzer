package pl.strava.analizator.infrastructure.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.AthleteProfileService;
import pl.strava.analizator.application.dto.AthleteProfileDto;
import pl.strava.analizator.application.dto.TrainingZoneDto;
import pl.strava.analizator.application.dto.UpdateProfileRequest;

@WebMvcTest(AthleteProfileController.class)
@Import(AthleteProfileControllerTest.TestSecurityConfig.class)
class AthleteProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AthleteProfileService profileService;

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
            http.csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }

    @Test
    void getProfileReturnsProfileData() throws Exception {
        AthleteProfileDto dto = AthleteProfileDto.builder()
                .id(UUID.randomUUID())
                .name("Jan Kowalski")
                .ftpWatts((short) 280)
                .lthrBpm((short) 170)
                .weightKg(BigDecimal.valueOf(75.5))
                .stravaConnected(true)
                .stravaAthleteId(12345L)
            .currentZones(List.of(TrainingZoneDto.builder()
                .id(UUID.randomUUID())
                .zoneType("power")
                .zoneNumber((short) 2)
                .zoneName("Endurance")
                .minValue((short) 156)
                .maxValue((short) 210)
                .color("#58A6FF")
                .validFrom(LocalDate.now())
                .build()))
                .createdAt(Instant.now())
                .build();

        when(profileService.getProfile()).thenReturn(dto);

        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Jan Kowalski"))
                .andExpect(jsonPath("$.ftpWatts").value(280))
                .andExpect(jsonPath("$.stravaConnected").value(true))
                .andExpect(jsonPath("$.currentZones[0].zoneType").value("power"))
                .andExpect(jsonPath("$.currentZones[0].zoneNumber").value(2));
    }

    @Test
    void updateProfileReturnUpdatedData() throws Exception {
        AthleteProfileDto updated = AthleteProfileDto.builder()
                .id(UUID.randomUUID())
                .name("Jan Kowalski")
                .ftpWatts((short) 290)
                .lthrBpm((short) 172)
                .stravaConnected(true)
                .build();

        when(profileService.updateProfile(any(UpdateProfileRequest.class))).thenReturn(updated);

        mockMvc.perform(put("/api/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ftpWatts\": 290, \"lthrBpm\": 172}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ftpWatts").value(290))
                .andExpect(jsonPath("$.lthrBpm").value(172));
    }
}
