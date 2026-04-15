package pl.strava.analizator.infrastructure.web;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.ai.AiActivityNoteService;
import pl.strava.analizator.application.dto.AiActivityNoteDto;
import pl.strava.analizator.application.dto.AiNoteAskRequest;
import pl.strava.analizator.application.dto.AiNoteAskResponse;

@RestController
@RequestMapping("/api/activities/{activityId}/ai-note")
@RequiredArgsConstructor
public class AiActivityNoteController {

    private final AiActivityNoteService noteService;

    @GetMapping
    public ResponseEntity<AiActivityNoteDto> getNote(@PathVariable UUID activityId) {
        AiActivityNoteDto note = noteService.getNote(activityId);
        return ResponseEntity.ok(note);
    }

    @PostMapping("/generate")
    public ResponseEntity<AiActivityNoteDto> generateNote(@PathVariable UUID activityId) {
        AiActivityNoteDto note = noteService.generateNote(activityId);
        return ResponseEntity.ok(note);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AiActivityNoteDto> refreshNote(@PathVariable UUID activityId) {
        AiActivityNoteDto note = noteService.refreshNote(activityId);
        return ResponseEntity.ok(note);
    }

    @PostMapping("/ask")
    public ResponseEntity<AiNoteAskResponse> ask(@PathVariable UUID activityId,
                                                   @RequestBody AiNoteAskRequest request) {
        AiNoteAskResponse response = noteService.askQuestion(activityId, request);
        return ResponseEntity.ok(response);
    }
}
