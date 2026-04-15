package pl.strava.analizator.infrastructure.web;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import pl.strava.analizator.application.WorkoutExportService;
import pl.strava.analizator.application.WorkoutTemplateService;

@ExtendWith(MockitoExtension.class)
class WorkoutExportControllerTest {

    @Mock
    private WorkoutTemplateService templateService;

    @Mock
    private WorkoutExportService exportService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        WorkoutTemplateController controller = new WorkoutTemplateController(templateService, exportService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void exportZwoReturns200WithXmlContentType() throws Exception {
        UUID id = UUID.randomUUID();
        byte[] zwoBytes = "<?xml version=\"1.0\"?><workout_file/>".getBytes();
        when(exportService.exportAsZwo(id)).thenReturn(zwoBytes);

        mockMvc.perform(get("/api/training/templates/{id}/export/zwo", id))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_XML))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"workout.zwo\""))
                .andExpect(content().bytes(zwoBytes));
    }

    @Test
    void exportFitReturns200WithOctetStreamContentType() throws Exception {
        UUID id = UUID.randomUUID();
        byte[] fitBytes = new byte[]{0x0E, 0x20, 0x00, 0x00};
        when(exportService.exportAsFit(id)).thenReturn(fitBytes);

        mockMvc.perform(get("/api/training/templates/{id}/export/fit", id))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"workout.fit\""))
                .andExpect(content().bytes(fitBytes));
    }

    @Test
    void exportReturns404WhenTemplateNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(exportService.exportAsZwo(id)).thenThrow(new IllegalArgumentException("Template not found"));

        mockMvc.perform(get("/api/training/templates/{id}/export/zwo", id))
                .andExpect(status().isNotFound());
    }
}
