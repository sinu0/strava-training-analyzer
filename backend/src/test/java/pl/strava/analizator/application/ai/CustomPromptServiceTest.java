package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.dto.CustomPromptDto;
import pl.strava.analizator.domain.ai.CustomPrompt;
import pl.strava.analizator.domain.port.CustomPromptPort;

@ExtendWith(MockitoExtension.class)
class CustomPromptServiceTest {

    @Mock
    private CustomPromptPort customPromptPort;

    @InjectMocks
    private CustomPromptService service;

    @Test
    void getAll_returnsAllPromptsSortedByUpdatedAt() {
        CustomPrompt prompt = samplePrompt();
        when(customPromptPort.findAll()).thenReturn(List.of(prompt));

        List<CustomPromptDto> result = service.getAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("My FTP Prompt");
    }

    @Test
    void getByType_filtersCorrectly() {
        CustomPrompt prompt = samplePrompt();
        when(customPromptPort.findByType("FTP_PREDICTION")).thenReturn(List.of(prompt));

        List<CustomPromptDto> result = service.getByType("FTP_PREDICTION");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPredictionType()).isEqualTo("FTP_PREDICTION");
    }

    @Test
    void save_newPrompt_createsEntity() {
        CustomPromptDto dto = CustomPromptDto.builder()
                .predictionType("FTP_PREDICTION")
                .name("New Prompt")
                .systemPrompt("You are a coach")
                .userPromptTemplate("Analyze: {{data}}")
                .build();

        CustomPrompt savedPrompt = samplePrompt();
        when(customPromptPort.save(any())).thenReturn(savedPrompt);

        CustomPromptDto result = service.save(dto);

        assertThat(result.getId()).isNotNull();
        verify(customPromptPort).save(any());
    }

    @Test
    void activate_deactivatesOthersFirst() {
        UUID id = UUID.randomUUID();
        CustomPrompt prompt = CustomPrompt.builder()
                .id(id)
                .predictionType("FTP_PREDICTION")
                .name("My FTP Prompt")
                .systemPrompt("You are a cycling coach")
                .userPromptTemplate("Analyze: {{athleteProfile}}")
                .responseFormat("{\"ftp\": 0}")
                .active(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        CustomPrompt activePrompt = CustomPrompt.builder()
                .id(UUID.randomUUID())
                .predictionType("FTP_PREDICTION")
                .name("Active Prompt")
                .systemPrompt("Coach")
                .userPromptTemplate("Template")
                .responseFormat("{}")
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(customPromptPort.findById(id)).thenReturn(Optional.of(prompt));
        when(customPromptPort.findActiveByType("FTP_PREDICTION")).thenReturn(Optional.of(activePrompt));
        when(customPromptPort.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CustomPromptDto result = service.activate(id);

        assertThat(result.isActive()).isTrue();
    }

    @Test
    void deactivate_setsActiveFalse() {
        UUID id = UUID.randomUUID();
        CustomPrompt prompt = CustomPrompt.builder()
                .id(id)
                .predictionType("FTP_PREDICTION")
                .name("My FTP Prompt")
                .systemPrompt("You are a cycling coach")
                .userPromptTemplate("Analyze: {{athleteProfile}}")
                .responseFormat("{\"ftp\": 0}")
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        when(customPromptPort.findById(id)).thenReturn(Optional.of(prompt));
        when(customPromptPort.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CustomPromptDto result = service.deactivate(id);

        assertThat(result.isActive()).isFalse();
    }

    @Test
    void getActiveForType_returnsActivePrompt() {
        CustomPrompt prompt = CustomPrompt.builder()
                .id(UUID.randomUUID())
                .predictionType("FTP_PREDICTION")
                .name("Active Prompt")
                .systemPrompt("Coach")
                .userPromptTemplate("Template")
                .responseFormat("{}")
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        when(customPromptPort.findActiveByType("FTP_PREDICTION")).thenReturn(Optional.of(prompt));

        Optional<CustomPromptDto> result = service.getActiveForType("FTP_PREDICTION");

        assertThat(result).isPresent();
        assertThat(result.get().isActive()).isTrue();
    }

    @Test
    void getActiveForType_noActive_returnsEmpty() {
        when(customPromptPort.findActiveByType("FTP_PREDICTION")).thenReturn(Optional.empty());

        Optional<CustomPromptDto> result = service.getActiveForType("FTP_PREDICTION");

        assertThat(result).isEmpty();
    }

    @Test
    void activate_notFound_throwsException() {
        UUID id = UUID.randomUUID();
        when(customPromptPort.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.activate(id))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Custom prompt not found");
    }

    @Test
    void delete_delegatesToRepository() {
        UUID id = UUID.randomUUID();
        service.delete(id);
        verify(customPromptPort).deleteById(id);
    }

    private CustomPrompt samplePrompt() {
        return CustomPrompt.builder()
                .id(UUID.randomUUID())
                .predictionType("FTP_PREDICTION")
                .name("My FTP Prompt")
                .systemPrompt("You are a cycling coach")
                .userPromptTemplate("Analyze: {{athleteProfile}}")
                .responseFormat("{\"ftp\": 0}")
                .active(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }
}
