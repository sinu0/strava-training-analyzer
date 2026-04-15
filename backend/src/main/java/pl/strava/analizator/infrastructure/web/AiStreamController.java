package pl.strava.analizator.infrastructure.web;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ai.AiPredictionService;
import pl.strava.analizator.application.dto.PredictionRequestDto;
import pl.strava.analizator.application.dto.PredictionResponseDto;

/**
 * SSE endpoint for streaming prediction progress.
 * Sends events: "status" (stage updates) and "result" (final prediction).
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiStreamController {

    private static final Logger log = LoggerFactory.getLogger(AiStreamController.class);

    private final AiPredictionService aiPredictionService;

    @PostMapping(value = "/predict/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter predictStream(@RequestBody PredictionRequestDto request) {
        SseEmitter emitter = new SseEmitter(120_000L);

        Thread.startVirtualThread(() -> {
            try {
                emitter.send(SseEmitter.event().name("status").data("Budowanie kontekstu treningowego..."));
                Thread.sleep(100);

                emitter.send(SseEmitter.event().name("status").data("Generowanie promptu..."));
                Thread.sleep(100);

                emitter.send(SseEmitter.event().name("status").data("Wysyłanie do modelu LLM..."));

                PredictionResponseDto result = aiPredictionService.predict(request);

                emitter.send(SseEmitter.event().name("status").data("Parsowanie odpowiedzi..."));
                emitter.send(SseEmitter.event().name("result").data(result));
                emitter.complete();
            } catch (Exception e) {
                log.error("SSE prediction stream error: {}", e.getMessage());
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                } catch (IOException ignored) {
                    // client disconnected
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }
}
