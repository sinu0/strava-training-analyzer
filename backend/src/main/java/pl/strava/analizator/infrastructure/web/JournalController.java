package pl.strava.analizator.infrastructure.web;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import pl.strava.analizator.application.JournalService;
import pl.strava.analizator.application.dto.JournalEntryDto;
import pl.strava.analizator.application.dto.MoodCorrelationDto;
import pl.strava.analizator.application.dto.SaveJournalEntryRequest;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    @GetMapping
    public ResponseEntity<List<JournalEntryDto>> getEntries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to == null) to = LocalDate.now();
        return ResponseEntity.ok(journalService.getEntries(from, to));
    }

    @GetMapping("/activity/{activityId}")
    public ResponseEntity<JournalEntryDto> getByActivityId(@PathVariable UUID activityId) {
        var entry = journalService.getByActivityId(activityId);
        return entry != null ? ResponseEntity.ok(entry) : ResponseEntity.notFound().build();
    }

    @GetMapping("/recent")
    public ResponseEntity<List<JournalEntryDto>> getRecent(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(journalService.getRecent(limit));
    }

    @GetMapping("/latest")
    public ResponseEntity<JournalEntryDto> getLatest() {
        var entry = journalService.getLatestEntry();
        return ResponseEntity.ok(entry);
    }

    @GetMapping("/mood-correlation")
    public ResponseEntity<MoodCorrelationDto> getMoodCorrelation() {
        return ResponseEntity.ok(journalService.getMoodCorrelation());
    }

    @PostMapping
    public ResponseEntity<JournalEntryDto> save(@Valid @RequestBody SaveJournalEntryRequest request) {
        return ResponseEntity.ok(journalService.save(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        journalService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
