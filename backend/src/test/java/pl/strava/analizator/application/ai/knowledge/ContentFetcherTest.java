package pl.strava.analizator.application.ai.knowledge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.net.http.HttpClient;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class ContentFetcherTest {

    @AfterEach
    void clearInterruptedFlag() {
        Thread.interrupted();
    }

    @Test
    void ioFailureDoesNotMarkWorkerThreadAsInterrupted() throws Exception {
        Thread.interrupted();
        HttpClient client = mock(HttpClient.class);
        when(client.send(any(), any())).thenThrow(new IOException("connection reset"));

        String result = new ContentFetcher(client).fetch("https://example.test/source");

        assertThat(result).isNull();
        assertThat(Thread.currentThread().isInterrupted()).isFalse();
    }

    @Test
    void interruptedRequestRestoresWorkerThreadInterruptFlag() throws Exception {
        Thread.interrupted();
        HttpClient client = mock(HttpClient.class);
        when(client.send(any(), any())).thenThrow(new InterruptedException("cancelled"));

        String result = new ContentFetcher(client).fetch("https://example.test/source");

        assertThat(result).isNull();
        assertThat(Thread.currentThread().isInterrupted()).isTrue();
    }
}
