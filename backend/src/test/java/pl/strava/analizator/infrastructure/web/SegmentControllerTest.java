package pl.strava.analizator.infrastructure.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

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

import pl.strava.analizator.application.SegmentAnalysisService;
import pl.strava.analizator.application.dto.SegmentComparisonDto;
import pl.strava.analizator.application.dto.SegmentComparisonSeriesDto;
import pl.strava.analizator.application.dto.SegmentEffortDto;
import pl.strava.analizator.application.dto.SegmentPageDto;

@WebMvcTest(SegmentController.class)
@Import({GlobalExceptionHandler.class, SegmentControllerTest.SecurityConfig.class})
class SegmentControllerTest {
    @Autowired MockMvc mockMvc;
    @MockitoBean SegmentAnalysisService service;

    @TestConfiguration static class SecurityConfig {
        @Bean SecurityFilterChain filters(HttpSecurity http) throws Exception {
            http.csrf(csrf -> csrf.disable()).authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }

    @Test void exposesPaginatedCatalogContract() throws Exception {
        when(service.findSegments(eq("las"), eq(true), eq(new java.math.BigDecimal("1000")),
                eq(new java.math.BigDecimal("5000")), eq(new java.math.BigDecimal("3")),
                eq("attempts"), eq(0), eq(30)))
                .thenReturn(SegmentPageDto.builder().items(List.of()).total(0).page(0).size(30).totalPages(0).build());
        mockMvc.perform(get("/api/v2/segments").param("q", "las").param("favorite", "true")
                        .param("minDistanceM", "1000").param("maxDistanceM", "5000")
                        .param("minAverageGrade", "3").param("sort", "attempts"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items").isArray()).andExpect(jsonPath("$.size").value(30));
    }

    @Test void comparisonContractAcceptsAtMostThreeSelectedIds() throws Exception {
        UUID first = UUID.randomUUID();
        when(service.compare(eq(7L), any(), eq(first))).thenReturn(SegmentComparisonDto.builder()
                .segmentId(7L).referenceEffortId(first).series(List.of(SegmentComparisonSeriesDto.builder()
                        .effortId(first).points(List.of()).build())).build());
        mockMvc.perform(get("/api/v2/segments/7/comparison")
                        .param("effortIds", first.toString()).param("referenceEffortId", first.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.segmentId").value(7))
                .andExpect(jsonPath("$.series.length()").value(1));
    }

    @Test void exposesOwnEffortsAsASeparateResource() throws Exception {
        UUID effortId = UUID.randomUUID();
        when(service.findSegmentEfforts(7L)).thenReturn(List.of(SegmentEffortDto.builder()
                .id(effortId).segmentId(7L).activityId(UUID.randomUUID()).sequence(0).build()));

        mockMvc.perform(get("/api/v2/segments/7/efforts"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(effortId.toString()))
                .andExpect(jsonPath("$[0].segmentId").value(7));
    }
}
