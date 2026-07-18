package pl.strava.analizator.infrastructure.strava;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.domain.model.AthleteProfile;

@WebMvcTest(StravaAuthController.class)
@Import(StravaAuthControllerTest.TestSecurityConfig.class)
class StravaAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StravaOAuth2Service oAuth2Service;

    @MockitoBean
    private StravaProperties stravaProperties;

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
    void connectReturnsAuthorizationUrl() throws Exception {
        when(oAuth2Service.getAuthorizationUrl())
                .thenReturn("https://www.strava.com/oauth/authorize?client_id=123&redirect_uri=http://localhost:8080/api/auth/strava/callback&response_type=code&scope=read,activity:read_all,profile:read_all");

        mockMvc.perform(get("/api/auth/strava/connect"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value(
                        "https://www.strava.com/oauth/authorize?client_id=123&redirect_uri=http://localhost:8080/api/auth/strava/callback&response_type=code&scope=read,activity:read_all,profile:read_all"));
    }

    @Test
    void callbackExchangesCodeAndRedirects() throws Exception {
        AthleteProfile profile = AthleteProfile.builder()
                .stravaAthleteId(12345L)
                .name("Jan Kowalski")
                .build();

        when(oAuth2Service.exchangeCodeForTokens(anyString(), anyString())).thenReturn(profile);

        mockMvc.perform(get("/api/auth/strava/callback")
                        .param("code", "auth-code-xyz")
                        .param("state", "csrf-state")
                        .param("scope", "read,activity:read_all"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "http://localhost:5173/?strava=connected"));
    }

    @Test
    void callbackRequiresOauthState() throws Exception {
        mockMvc.perform(get("/api/auth/strava/callback")
                        .param("code", "auth-code-xyz"))
                .andExpect(status().isBadRequest());
    }
}
