package pl.strava.analizator.application.ai;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AiNoteQueueProcessorTest {

    @Mock private AiActivityNoteService noteService;

    @Test
    void unavailableProviderOpensCooldownInsteadOfHammeringQueue() {
        when(noteService.isDefaultProviderAvailable()).thenReturn(false);
        AiNoteQueueProcessor processor = new AiNoteQueueProcessor(
                noteService, true, Duration.ofMinutes(5), Duration.ofMinutes(15));

        processor.processQueue();
        processor.processQueue();

        verify(noteService).isDefaultProviderAvailable();
        verify(noteService, never()).processNextJob();
    }

    @Test
    void recoversStaleJobsBeforeProcessingAvailableQueue() {
        when(noteService.isDefaultProviderAvailable()).thenReturn(true);
        AiNoteQueueProcessor processor = new AiNoteQueueProcessor(
                noteService, true, Duration.ofMinutes(5), Duration.ofMinutes(15));

        processor.processQueue();

        verify(noteService).recoverStaleJobs(Duration.ofMinutes(15));
        verify(noteService).processNextJob();
    }
}
