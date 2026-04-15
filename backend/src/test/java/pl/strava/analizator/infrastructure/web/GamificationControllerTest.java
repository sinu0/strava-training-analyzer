package pl.strava.analizator.infrastructure.web;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import pl.strava.analizator.application.GamificationService;
import pl.strava.analizator.application.dto.AchievementDto;
import pl.strava.analizator.infrastructure.config.SecurityConfig;

@WebMvcTest(GamificationController.class)
@Import(SecurityConfig.class)
class GamificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GamificationService gamificationService;

    @Test
    void getAchievements_returns200WithList() throws Exception {
        when(gamificationService.getAchievements()).thenReturn(List.of(
                AchievementDto.builder()
                        .id("weekly-100km")
                        .name("Setka w tygodniu")
                        .description("Przejechaj 100 km w jednym tygodniu")
                        .icon("🏅")
                        .type("DISTANCE")
                        .unlocked(false)
                        .build(),
                AchievementDto.builder()
                        .id("ftp-200")
                        .name("FTP 200 W")
                        .description("Osiągnij FTP na poziomie 200 W")
                        .icon("💪")
                        .type("FTP")
                        .unlocked(true)
                        .unlockedAt(LocalDate.of(2024, 6, 1))
                        .build()
        ));

        mockMvc.perform(get("/api/gamification/achievements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id", is("weekly-100km")))
                .andExpect(jsonPath("$[0].name", is("Setka w tygodniu")))
                .andExpect(jsonPath("$[0].unlocked", is(false)))
                .andExpect(jsonPath("$[1].id", is("ftp-200")))
                .andExpect(jsonPath("$[1].unlocked", is(true)));
    }

    @Test
    void evaluateAchievements_returns200WithUpdatedList() throws Exception {
        when(gamificationService.evaluateAll()).thenReturn(List.of(
                AchievementDto.builder()
                        .id("weekly-100km")
                        .name("Setka w tygodniu")
                        .type("DISTANCE")
                        .unlocked(true)
                        .unlockedAt(LocalDate.of(2024, 6, 15))
                        .build()
        ));

        mockMvc.perform(post("/api/gamification/achievements/evaluate")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is("weekly-100km")))
                .andExpect(jsonPath("$[0].unlocked", is(true)));
    }
}
