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
import pl.strava.analizator.application.ImportJobService;
import pl.strava.analizator.application.RecalculationJobService;
import pl.strava.analizator.application.dto.ImportJobRequest;
import pl.strava.analizator.application.dto.ProcessingJobDto;

@RestController
@RequestMapping("/api/v2")
@RequiredArgsConstructor
public class V2JobController {

    private final ImportJobService importJobService;
    private final RecalculationJobService recalculationJobService;

    @PostMapping("/import-jobs")
    public ResponseEntity<ProcessingJobDto> createImportJob(
            @RequestBody(required = false) ImportJobRequest request) {
        String mode = request != null ? request.getMode() : null;
        ProcessingJobDto response = ProcessingJobDto.from(importJobService.create(mode));
        return ResponseEntity.accepted().body(response);
    }

    @PostMapping("/recalculation-jobs")
    public ResponseEntity<ProcessingJobDto> createRecalculationJob() {
        return ResponseEntity.accepted()
                .body(ProcessingJobDto.from(recalculationJobService.create()));
    }

    @GetMapping("/jobs/{id}")
    public ProcessingJobDto getJob(@PathVariable UUID id) {
        return ProcessingJobDto.from(importJobService.get(id));
    }

    @PostMapping("/jobs/{id}/retry")
    public ResponseEntity<ProcessingJobDto> retryJob(@PathVariable UUID id) {
        return ResponseEntity.accepted().body(ProcessingJobDto.from(importJobService.retry(id)));
    }
}
