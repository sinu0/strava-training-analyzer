package pl.strava.analizator.application.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import pl.strava.analizator.application.JournalService;
import pl.strava.analizator.application.dto.AiNoteAskRequest;
import pl.strava.analizator.domain.ai.AiNoteJob;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AiActivityNoteRepository;
import pl.strava.analizator.domain.port.AiNoteJobRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;

@ExtendWith(MockitoExtension.class)
class AiActivityNoteServiceQueueTest {

    @Mock private ActivityRepository activityRepository;
    @Mock private ActivityMetricRepository activityMetricRepository;
    @Mock private AthleteProfileRepository athleteProfileRepository;
    @Mock private DailyMetricRepository dailyMetricRepository;
    @Mock private AiActivityNoteRepository noteRepository;
    @Mock private AiNoteJobRepository jobRepository;
    @Mock private LlmProviderRegistry providerRegistry;
    @Mock private ToolCallingLoop toolCallingLoop;
    @Mock private JournalService journalService;
    @Mock private AiPromptDirectives aiPromptDirectives;
    @Mock private pl.strava.analizator.domain.ai.LlmPort provider;

    private AiActivityNoteService service;

    @BeforeEach
    void setUp() {
        service = new AiActivityNoteService(activityRepository, activityMetricRepository,
                athleteProfileRepository, dailyMetricRepository, noteRepository, jobRepository,
                providerRegistry, toolCallingLoop, journalService, aiPromptDirectives, "ollama", "model", true);
        org.mockito.Mockito.lenient().when(aiPromptDirectives.systemSuffix()).thenReturn("SUFFIX-PL");
    }

    @Test
    void failedGenerationSchedulesExponentialBackoff() {
        UUID activityId = UUID.randomUUID();
        AiNoteJob pending = AiNoteJob.builder()
                .id(UUID.randomUUID())
                .activityId(activityId)
                .status(AiNoteJob.STATUS_PENDING)
                .createdAt(Instant.now().minusSeconds(60))
                .nextAttemptAt(Instant.now().minusSeconds(1))
                .retryCount(1)
                .build();
        when(jobRepository.findNextPending(any())).thenReturn(Optional.of(pending));
        when(jobRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(activityRepository.findById(activityId)).thenReturn(Optional.of(
                Activity.builder().id(activityId).name("Ride").build()));
        when(toolCallingLoop.run(any(), any(), any(), any(), any()))
                .thenThrow(new IllegalStateException("provider offline"));

        Instant before = Instant.now();
        service.processNextJob();

        ArgumentCaptor<AiNoteJob> jobs = ArgumentCaptor.forClass(AiNoteJob.class);
        verify(jobRepository, org.mockito.Mockito.times(2)).save(jobs.capture());
        AiNoteJob retry = jobs.getAllValues().get(1);
        assertThat(retry.getStatus()).isEqualTo(AiNoteJob.STATUS_PENDING);
        assertThat(retry.getRetryCount()).isEqualTo(2);
        assertThat(retry.getNextAttemptAt()).isAfterOrEqualTo(before.plus(Duration.ofMinutes(2)));
    }

    @Test
    void staleProcessingJobReturnsToQueueWithoutConsumingRetry() {
        AiNoteJob stale = AiNoteJob.builder()
                .id(UUID.randomUUID())
                .activityId(UUID.randomUUID())
                .status(AiNoteJob.STATUS_PROCESSING)
                .createdAt(Instant.now().minusSeconds(1200))
                .startedAt(Instant.now().minusSeconds(1200))
                .retryCount(1)
                .build();
        when(jobRepository.findStaleProcessing(any())).thenReturn(List.of(stale));

        service.recoverStaleJobs(Duration.ofMinutes(15));

        ArgumentCaptor<AiNoteJob> job = ArgumentCaptor.forClass(AiNoteJob.class);
        verify(jobRepository).save(job.capture());
        assertThat(job.getValue().getStatus()).isEqualTo(AiNoteJob.STATUS_PENDING);
        assertThat(job.getValue().getRetryCount()).isEqualTo(1);
        assertThat(job.getValue().getNextAttemptAt()).isNotNull();
    }

    @Test
    void generatedNoteUsesConfiguredLanguageDirective() {
        UUID activityId = UUID.randomUUID();
        when(activityRepository.findById(activityId)).thenReturn(Optional.of(
                Activity.builder().id(activityId).name("Ride").build()));
        when(toolCallingLoop.run(any(), any(), any(), any(), any())).thenReturn("Podsumowanie\n\nSzczegóły");
        when(noteRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.generateNote(activityId);

        ArgumentCaptor<String> systemPrompt = ArgumentCaptor.forClass(String.class);
        verify(toolCallingLoop).run(systemPrompt.capture(), any(), any(), any(), any());
        assertThat(systemPrompt.getValue())
                .endsWith("SUFFIX-PL")
                .doesNotContain("any language other than English");
    }

    @Test
    void followUpAnswerUsesConfiguredLanguageDirective() {
        UUID activityId = UUID.randomUUID();
        when(activityRepository.findById(activityId)).thenReturn(Optional.of(
                Activity.builder().id(activityId).name("Ride").build()));
        when(aiPromptDirectives.systemSuffix()).thenReturn("SUFFIX-EN");
        when(providerRegistry.getProvider("ollama")).thenReturn(provider);
        when(provider.chat(any(), any(), any())).thenReturn("answer");

        service.askQuestion(activityId, new AiNoteAskRequest("Why?"));

        ArgumentCaptor<String> systemPrompt = ArgumentCaptor.forClass(String.class);
        verify(provider).chat(systemPrompt.capture(), any(), any());
        assertThat(systemPrompt.getValue())
                .endsWith("SUFFIX-EN")
                .doesNotContain("Respond in English only");
    }
}
