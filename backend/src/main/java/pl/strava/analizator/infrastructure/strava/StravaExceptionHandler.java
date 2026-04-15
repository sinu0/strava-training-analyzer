package pl.strava.analizator.infrastructure.strava;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "pl.strava.analizator.infrastructure.strava")
public class StravaExceptionHandler {

    @ExceptionHandler(StravaApiException.class)
    public ResponseEntity<Map<String, Object>> handleStravaApiError(StravaApiException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of(
                        "status", HttpStatus.BAD_GATEWAY.value(),
                        "error", HttpStatus.BAD_GATEWAY.getReasonPhrase(),
                        "message", ex.getMessage(),
                        "timestamp", Instant.now().toString()
                ));
    }
}
