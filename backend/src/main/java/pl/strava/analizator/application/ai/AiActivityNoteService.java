package pl.strava.analizator.application.ai;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import pl.strava.analizator.application.JournalService;
import pl.strava.analizator.application.dto.AiActivityNoteDto;
import pl.strava.analizator.application.dto.AiNoteAskRequest;
import pl.strava.analizator.application.dto.AiNoteAskResponse;
import pl.strava.analizator.domain.ai.AiActivityNote;
import pl.strava.analizator.domain.ai.AiNoteJob;
import pl.strava.analizator.domain.ai.LlmPort;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.model.MetricResult;
import pl.strava.analizator.domain.port.ActivityMetricRepository;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AiActivityNoteRepository;
import pl.strava.analizator.domain.port.AiNoteJobRepository;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.vo.DateRange;

/**
 * Service that generates AI coaching notes for individual activities.
 * Analyses time-series data (power, HR, cadence), computed metrics,
 * and historical context to produce a comprehensive coach-style review.
 */
@Service
public class AiActivityNoteService {

    private static final Logger log = LoggerFactory.getLogger(AiActivityNoteService.class);

    private final ActivityRepository activityRepository;
    private final ActivityMetricRepository activityMetricRepository;
    private final AthleteProfileRepository athleteProfileRepository;
    private final DailyMetricRepository dailyMetricRepository;
    private final AiActivityNoteRepository noteRepository;
    private final AiNoteJobRepository jobRepository;
    private final LlmProviderRegistry providerRegistry;
    private final ToolCallingLoop toolCallingLoop;
    private final JournalService journalService;
    private final String defaultProvider;
    private final String defaultModel;
    private final boolean enabled;

    public AiActivityNoteService(ActivityRepository activityRepository,
                                  ActivityMetricRepository activityMetricRepository,
                                  AthleteProfileRepository athleteProfileRepository,
                                  DailyMetricRepository dailyMetricRepository,
                                  AiActivityNoteRepository noteRepository,
                                  AiNoteJobRepository jobRepository,
                                  LlmProviderRegistry providerRegistry,
                                  ToolCallingLoop toolCallingLoop,
                                  JournalService journalService,
                                  @Value("${ai.provider:ollama}") String defaultProvider,
                                  @Value("${ai.model:llama3}") String defaultModel,
                                  @Value("${ai.enabled:false}") boolean enabled) {
        this.activityRepository = activityRepository;
        this.activityMetricRepository = activityMetricRepository;
        this.athleteProfileRepository = athleteProfileRepository;
        this.dailyMetricRepository = dailyMetricRepository;
        this.noteRepository = noteRepository;
        this.jobRepository = jobRepository;
        this.providerRegistry = providerRegistry;
        this.toolCallingLoop = toolCallingLoop;
        this.journalService = journalService;
        this.defaultProvider = defaultProvider;
        this.defaultModel = defaultModel;
        this.enabled = enabled;
    }

    /**
     * Returns the existing note for an activity, or null with queue status info.
     */
    public AiActivityNoteDto getNote(UUID activityId) {
        return noteRepository.findByActivityId(activityId)
                .map(this::toDto)
                .orElseGet(() -> {
                    // Check if generation is queued/in-progress
                    String queueStatus = jobRepository.findByActivityId(activityId)
                            .map(AiNoteJob::getStatus)
                            .orElse(null);
                    return AiActivityNoteDto.builder()
                            .activityId(activityId)
                            .queueStatus(queueStatus)
                            .build();
                });
    }

    /**
     * Generates a note on-demand (synchronous).
     */
    public AiActivityNoteDto generateNote(UUID activityId) {
        if (!enabled) {
            throw new AiModuleDisabledException("AI module is not enabled.");
        }

        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found: " + activityId));

        return generateAndSaveNote(activity);
    }

    /**
     * Regenerates (refreshes) the note for an activity.
     */
    public AiActivityNoteDto refreshNote(UUID activityId) {
        noteRepository.deleteByActivityId(activityId);
        return generateNote(activityId);
    }

    /**
     * Ask a follow-up question about the activity based on its AI note.
     */
    public AiNoteAskResponse askQuestion(UUID activityId, AiNoteAskRequest request) {
        if (!enabled) {
            throw new AiModuleDisabledException("AI module is not enabled.");
        }

        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new IllegalArgumentException("Activity not found: " + activityId));

        AiActivityNote existingNote = noteRepository.findByActivityId(activityId).orElse(null);

        String systemPrompt = """
                You are an expert endurance sports coach. Answer the athlete's follow-up question \
                about a specific training session. You have access to the activity data and the \
                previously generated coaching note. Answer concisely and specifically, backed by \
                the numbers provided. Respond in English only. Maximum 300 words.
                """;

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("ACTIVITY DATA:\n").append(buildActivityContext(activity));
        if (existingNote != null) {
            userPrompt.append("\n\nPREVIOUS AI COACHING NOTE:\n")
                       .append(existingNote.getSummary()).append("\n")
                       .append(existingNote.getDetail());
        }
        userPrompt.append("\n\nATHLETE'S QUESTION:\n").append(request.getQuestion());

        LlmPort provider = providerRegistry.getProvider(defaultProvider);
        String answer = provider.chat(systemPrompt, userPrompt.toString(), defaultModel);

        return AiNoteAskResponse.builder()
                .answer(answer)
                .modelId(defaultModel)
                .providerName(defaultProvider)
                .build();
    }

    /**
     * Enqueues note generation for an activity (called after sync).
     */
    public void enqueueNoteGeneration(UUID activityId) {
        if (!enabled) {
            return;
        }
        // Don't enqueue if note already exists or job already pending
        if (noteRepository.findByActivityId(activityId).isPresent()) {
            return;
        }
        if (jobRepository.findByActivityId(activityId).isPresent()) {
            return;
        }

        AiNoteJob job = AiNoteJob.builder()
                .activityId(activityId)
                .status(AiNoteJob.STATUS_PENDING)
                .createdAt(Instant.now())
                .retryCount(0)
                .build();
        jobRepository.save(job);
        log.debug("Enqueued AI note generation for activity {}", activityId);
    }

    /**
     * Processes the next pending job from the queue. Called by the scheduled processor.
     */
    public boolean processNextJob() {
        if (!enabled) {
            return false;
        }

        return jobRepository.findNextPending().map(job -> {
            AiNoteJob processing = AiNoteJob.builder()
                    .id(job.getId())
                    .activityId(job.getActivityId())
                    .status(AiNoteJob.STATUS_PROCESSING)
                    .createdAt(job.getCreatedAt())
                    .startedAt(Instant.now())
                    .retryCount(job.getRetryCount())
                    .build();
            jobRepository.save(processing);

            try {
                Activity activity = activityRepository.findById(job.getActivityId())
                        .orElseThrow(() -> new IllegalArgumentException("Activity not found"));
                generateAndSaveNote(activity);

                AiNoteJob completed = AiNoteJob.builder()
                        .id(job.getId())
                        .activityId(job.getActivityId())
                        .status(AiNoteJob.STATUS_COMPLETED)
                        .createdAt(job.getCreatedAt())
                        .startedAt(processing.getStartedAt())
                        .completedAt(Instant.now())
                        .retryCount(job.getRetryCount())
                        .build();
                jobRepository.save(completed);
                log.info("AI note generated for activity {}", job.getActivityId());
                return true;
            } catch (Exception e) {
                log.error("Failed to generate AI note for activity {}: {}", job.getActivityId(), e.getMessage(), e);
                int newRetryCount = job.getRetryCount() + 1;
                String newStatus = newRetryCount >= AiNoteJob.MAX_RETRIES
                        ? AiNoteJob.STATUS_FAILED : AiNoteJob.STATUS_PENDING;

                AiNoteJob failed = AiNoteJob.builder()
                        .id(job.getId())
                        .activityId(job.getActivityId())
                        .status(newStatus)
                        .createdAt(job.getCreatedAt())
                        .startedAt(processing.getStartedAt())
                        .completedAt(Instant.now())
                        .errorMessage(e.getMessage())
                        .retryCount(newRetryCount)
                        .build();
                jobRepository.save(failed);
                return false;
            }
        }).orElse(false);
    }

    // ------- Internal -------

    private AiActivityNoteDto generateAndSaveNote(Activity activity) {
        String systemPrompt = buildSystemPrompt();
        String userPrompt = buildCoachPrompt(activity);

        String rawResponse = toolCallingLoop.run(systemPrompt, userPrompt, activity.getId(),
                defaultProvider, defaultModel);

        // Split response into summary (first paragraph) and detail (rest)
        String summary;
        String detail;
        int splitIdx = rawResponse.indexOf("\n\n");
        if (splitIdx > 0 && splitIdx < 500) {
            summary = rawResponse.substring(0, splitIdx).trim();
            detail = rawResponse.substring(splitIdx).trim();
        } else {
            summary = rawResponse.length() > 300 ? rawResponse.substring(0, 300).trim() + "..." : rawResponse.trim();
            detail = rawResponse;
        }

        // Delete any existing note and save the new one
        noteRepository.deleteByActivityId(activity.getId());

        AiActivityNote note = AiActivityNote.builder()
                .activityId(activity.getId())
                .summary(summary)
                .detail(detail)
                .modelId(defaultModel)
                .providerName(defaultProvider)
                .generatedAt(Instant.now())
                .build();
        AiActivityNote saved = noteRepository.save(note);
        return toDto(saved);
    }

    private String buildSystemPrompt() {
        return """
                You are an expert endurance sports coach and exercise physiologist specialising in \
                cycling, running, and triathlon. You receive structured training data for a completed \
                session and produce a coaching note that is concise, data-driven, and consistent \
                across all activities.

                ## REQUIRED OUTPUT STRUCTURE — always emit all six sections in this exact order

                **Summary**
                One sentence: activity type + key volume metric + one standout observation (with a number).
                Example: "60-minute tempo ride covering 42 km at IF 0.84, with well-controlled HR drift of +4%."

                **Intensity Assessment**
                Classify the session: Recovery / Endurance / Tempo / Threshold / High-Intensity / Mixed.
                Compare to the athlete's recent 14-day average for the same sport type.
                Always include IF and TSS if power data is present, or HR%HRmax if only HR is available.

                **What Went Well**
                2–4 bullet points. Each point must cite at least one number from the data.
                Examples of good points: consistent pacing, low VI, good cadence control, low HR drift.

                **Areas to Watch**
                2–3 bullet points of observations. Base every point on data. If everything looks optimal, \
                say so explicitly rather than inventing issues.

                **Stream Data Analysis**
                IMPORTANT: You must call `get_activity_stream_analysis` tool before writing this section. \
                Report results directly from the tool output:
                - Power zones (Coggan Z1-Z7), Variability Index, IF, coasting %.
                - Heart Rate: quarter-by-quarter trend (Q1→Q4 avg bpm), aerobic decoupling % \
                  (<5% = efficient, >10% = significant drift).
                - Cadence: average and % time pedalling.
                - Elevation-power relationship if available.
                If a channel has no data, write "not available" for that channel.

                **Next Session Recommendation**
                One specific, actionable recommendation with target zone and approximate duration. \
                Base it on current TSB (positive → can push harder, negative → prioritise recovery).

                ---

                ## RULES

                DO:
                - Follow the six-section structure every time, even if some data is missing.
                - Use exact numbers from the input. Quote units (W, bpm, rpm, km, min, %).
                - Say "not available" when a metric is absent — never use "?" or leave a gap.
                - Keep the tone professional, specific, and encouraging.
                - Keep the total response under 500 words.

                DO NOT:
                - Use vague praise such as "great job!" or "well done!" without supporting numbers.
                - Repeat the same observation in multiple sections.
                - Invent or estimate numbers that are not in the input data.
                - Write in Polish or any language other than English.
                - Add extra sections, preambles, or closing remarks beyond the six sections.
                """;
    }

    private String buildCoachPrompt(Activity activity) {
        StringBuilder sb = new StringBuilder();

        sb.append("## ACTIVITY DATA\n");
        sb.append(buildActivityContext(activity));

        // Include athlete's journal entry if present
        var journalEntry = journalService.getByActivityId(activity.getId());
        if (journalEntry != null) {
            sb.append("\n\n## ATHLETE'S OWN NOTES\n");
            sb.append(String.format("Mood: %s\n", journalEntry.getMood()));
            if (journalEntry.getNote() != null && !journalEntry.getNote().isBlank()) {
                sb.append(String.format("Note: %s\n", journalEntry.getNote()));
            }
            if (journalEntry.getTags() != null && !journalEntry.getTags().isEmpty()) {
                sb.append(String.format("Tags: %s\n", String.join(", ", journalEntry.getTags())));
            }
        }

        sb.append("\n\n## HISTORICAL CONTEXT\n");
        sb.append(buildHistoricalContext(activity));

        sb.append("\n\n## TOOL CALL REQUIRED\n");
        sb.append("Before writing the **Stream Data Analysis** section you MUST call the ");
        sb.append("`get_activity_stream_analysis` tool (no arguments needed — it defaults to the current activity). ");
        sb.append("Use the returned quarter-by-quarter breakdown, aerobic decoupling, and zone distributions ");
        sb.append("as the primary source for that section.\n");

        sb.append("\nGenerate a coaching note for this activity following the required six-section structure.");
        return sb.toString();
    }

    private String buildActivityContext(Activity activity) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Name: %s\n", activity.getName()));
        sb.append(String.format("Type: %s\n", activity.getSportType()));
        sb.append(String.format("Date: %s\n", activity.getStartedAt()));
        if (activity.getMovingTimeSec() != null) {
            sb.append(String.format("Moving time: %d min\n", activity.getMovingTimeSec() / 60));
        }
        if (activity.getDistanceM() != null) {
            sb.append(String.format("Distance: %.1f km\n", activity.getDistanceM().doubleValue() / 1000));
        }
        if (activity.getElevationGainM() != null) {
            sb.append(String.format("Elevation gain: %.0f m\n", activity.getElevationGainM().doubleValue()));
        }
        if (activity.getAvgSpeedMs() != null) {
            sb.append(String.format("Avg speed: %.1f km/h\n", activity.getAvgSpeedMs().doubleValue() * 3.6));
        }
        if (activity.getAvgHeartrate() != null) {
            sb.append(String.format("Avg HR: %d bpm", activity.getAvgHeartrate()));
            if (activity.getMaxHeartrate() != null) {
                sb.append(String.format(", Max HR: %d bpm", activity.getMaxHeartrate()));
            }
            sb.append("\n");
        }
        if (activity.getAvgPowerW() != null) {
            sb.append(String.format("Avg power: %d W", activity.getAvgPowerW()));
            if (activity.getMaxPowerW() != null) {
                sb.append(String.format(", Max power: %d W", activity.getMaxPowerW()));
            }
            sb.append("\n");
        }
        if (activity.getAvgCadence() != null) {
            sb.append(String.format("Avg cadence: %d rpm\n", activity.getAvgCadence()));
        }
        if (activity.getCalories() != null) {
            sb.append(String.format("Calories: %d kcal\n", activity.getCalories()));
        }

        // Computed metrics
        List<MetricResult> metrics = activityMetricRepository.findAllByActivityId(activity.getId());
        if (!metrics.isEmpty()) {
            sb.append("\nComputed metrics:\n");
            for (MetricResult m : metrics) {
                if (m.isNumeric()) {
                    sb.append(String.format("  %s: %.1f\n", m.getMetricName(), m.getNumericValue().doubleValue()));
                }
            }
        }

        // Stream analysis (computed on-the-fly)
        appendStreamAnalysis(sb, activity);

        return sb.toString();
    }

    private void appendStreamAnalysis(StringBuilder sb, Activity activity) {
        // Look up FTP for zone-based analysis
        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);
        Short ftpWatts = profile != null ? profile.getFtpWatts() : null;

        if (activity.getPowerStream() != null && activity.getPowerStream().length > 10) {
            int[] rawPower = activity.getPowerStream();
            int[] power = filterPositive(rawPower);
            if (power.length > 10) {
                sb.append("\nPower stream analysis (zeros excluded):\n");
                double avg = computeAvg(power);
                double stdDev = computeStdDev(power, avg);

                double np = computeNormalizedPower(rawPower);
                double vi = avg > 0 ? np / avg : 0;

                sb.append(String.format("  Avg power (pedalling): %.0f W, NP: %.0f W, VI: %.2f\n", avg, np, vi));
                sb.append(String.format("  Std dev: %.0f W, Min: %d W, Max: %d W\n",
                        stdDev, minVal(power), maxVal(power)));

                int zeroCount = rawPower.length - power.length;
                double coastingPct = 100.0 * zeroCount / rawPower.length;
                sb.append(String.format("  Coasting (0 W): %.0f%% of data points\n", coastingPct));

                if (ftpWatts != null && ftpWatts > 0) {
                    appendPowerZones(sb, rawPower, ftpWatts);
                    double ifFactor = np / ftpWatts;
                    sb.append(String.format("  Intensity Factor (IF): %.2f\n", ifFactor));
                }
            }
        }

        if (activity.getHeartrateStream() != null && activity.getHeartrateStream().length > 10) {
            int[] rawHr = activity.getHeartrateStream();
            int[] hr = filterAboveThreshold(rawHr, 40);
            if (hr.length > 10) {
                sb.append("\nHR stream analysis:\n");
                double avgHr = computeAvg(hr);
                sb.append(String.format("  Avg HR (filtered ≥40 bpm): %.0f bpm, Min: %d, Max: %d\n",
                        avgHr, minVal(hr), maxVal(hr)));

                appendHrDrift(sb, activity, rawHr);
            }
        }

        if (activity.getCadenceStream() != null && activity.getCadenceStream().length > 10) {
            int[] rawCad = activity.getCadenceStream();
            int[] cad = filterPositive(rawCad);
            if (cad.length > 10) {
                double avgCad = computeAvg(cad);
                double stdCad = computeStdDev(cad, avgCad);
                double zeroPct = 100.0 * (rawCad.length - cad.length) / rawCad.length;
                sb.append(String.format("\nCadence (pedalling only) — Avg: %.0f rpm, Std dev: %.0f rpm, Not pedalling: %.0f%%\n",
                        avgCad, stdCad, zeroPct));
            }
        }

        if (activity.getAltitudeStream() != null && activity.getAltitudeStream().length > 10) {
            double[] alt = activity.getAltitudeStream();
            double min = Double.MAX_VALUE, max = Double.MIN_VALUE;
            double totalClimb = 0, totalDescent = 0;
            for (int i = 0; i < alt.length; i++) {
                if (alt[i] < min) min = alt[i];
                if (alt[i] > max) max = alt[i];
                if (i > 0) {
                    double diff = alt[i] - alt[i - 1];
                    if (diff > 0) totalClimb += diff;
                    else totalDescent += Math.abs(diff);
                }
            }
            sb.append(String.format("\nAltitude profile — Min: %.0f m, Max: %.0f m, Range: %.0f m\n",
                    min, max, max - min));
            sb.append(String.format("  Total ascent: %.0f m, Total descent: %.0f m\n", totalClimb, totalDescent));
        }
    }

    private void appendPowerZones(StringBuilder sb, int[] power, int ftp) {
        // Coggan power zones
        int z1 = 0, z2 = 0, z3 = 0, z4 = 0, z5 = 0, z6 = 0, z7 = 0;
        for (int p : power) {
            if (p <= 0) continue;
            double pctFtp = (double) p / ftp;
            if (pctFtp < 0.55) z1++;
            else if (pctFtp < 0.75) z2++;
            else if (pctFtp < 0.90) z3++;
            else if (pctFtp < 1.05) z4++;
            else if (pctFtp < 1.20) z5++;
            else if (pctFtp < 1.50) z6++;
            else z7++;
        }
        int total = z1 + z2 + z3 + z4 + z5 + z6 + z7;
        if (total > 0) {
            sb.append("  Power zones (% of pedalling time, Coggan):\n");
            sb.append(String.format("    Z1 Recovery (<55%%FTP): %.0f%%, Z2 Endurance: %.0f%%, Z3 Tempo: %.0f%%\n",
                    100.0 * z1 / total, 100.0 * z2 / total, 100.0 * z3 / total));
            sb.append(String.format("    Z4 Threshold: %.0f%%, Z5 VO2max: %.0f%%, Z6 Anaerobic: %.0f%%, Z7 Sprint: %.0f%%\n",
                    100.0 * z4 / total, 100.0 * z5 / total, 100.0 * z6 / total, 100.0 * z7 / total));
        }
    }

    private void appendHrDrift(StringBuilder sb, Activity activity, int[] rawHr) {
        int[] timeStream = activity.getTimeStream();
        if (timeStream != null && timeStream.length == rawHr.length) {
            // Time-based split: find midpoint by elapsed time
            int totalTime = timeStream[timeStream.length - 1] - timeStream[0];
            int midTime = timeStream[0] + totalTime / 2;
            int midIdx = 0;
            for (int i = 0; i < timeStream.length; i++) {
                if (timeStream[i] >= midTime) {
                    midIdx = i;
                    break;
                }
            }
            double firstHalf = computeFilteredAvgRange(rawHr, 0, midIdx, 40);
            double secondHalf = computeFilteredAvgRange(rawHr, midIdx, rawHr.length, 40);
            if (firstHalf > 0) {
                double drift = ((secondHalf - firstHalf) / firstHalf) * 100;
                sb.append(String.format("  HR drift (time-based): 1st half: %.0f bpm, 2nd half: %.0f bpm, drift: %+.1f%%\n",
                        firstHalf, secondHalf, drift));
            }
        } else {
            int halfLen = rawHr.length / 2;
            double firstHalf = computeFilteredAvgRange(rawHr, 0, halfLen, 40);
            double secondHalf = computeFilteredAvgRange(rawHr, halfLen, rawHr.length, 40);
            if (firstHalf > 0) {
                double drift = ((secondHalf - firstHalf) / firstHalf) * 100;
                sb.append(String.format("  HR drift (index-based): 1st half: %.0f bpm, 2nd half: %.0f bpm, drift: %+.1f%%\n",
                        firstHalf, secondHalf, drift));
            }
        }
    }

    private String buildHistoricalContext(Activity activity) {
        StringBuilder sb = new StringBuilder();

        // Athlete profile
        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);
        if (profile != null) {
            sb.append("Athlete profile:\n");
            if (profile.getFtpWatts() != null) sb.append(String.format("  FTP: %d W\n", profile.getFtpWatts()));
            if (profile.getWeightKg() != null) sb.append(String.format("  Weight: %.1f kg\n", profile.getWeightKg().doubleValue()));
            if (profile.getMaxHrBpm() != null) sb.append(String.format("  Max HR: %d bpm\n", profile.getMaxHrBpm()));
            if (profile.getFtpWatts() != null && profile.getWeightKg() != null
                    && profile.getWeightKg().doubleValue() > 0) {
                double wpkg = profile.getFtpWatts() / profile.getWeightKg().doubleValue();
                sb.append(String.format("  W/kg (FTP): %.2f\n", wpkg));
            }
        }

        // Recent activities (last 14 days, same sport type, excluding current)
        OffsetDateTime from = OffsetDateTime.now(ZoneOffset.UTC).minusDays(14);
        OffsetDateTime to = OffsetDateTime.now(ZoneOffset.UTC);
        List<Activity> recent = activityRepository.findByStartedAtBetween(from, to);
        recent = recent.stream()
                .filter(a -> !a.getId().equals(activity.getId()))
                .filter(a -> activity.getSportType() != null && activity.getSportType().equals(a.getSportType()))
                .toList();

        if (!recent.isEmpty()) {
            sb.append(String.format("\nRecent %d activities (last 14 days, same type):\n", recent.size()));
            for (Activity a : recent) {
                sb.append(String.format("  [%s] %s",
                        a.getStartedAt() != null ? a.getStartedAt().toLocalDate() : "unknown date",
                        a.getName()));
                if (a.getMovingTimeSec() != null) sb.append(String.format(", %d min", a.getMovingTimeSec() / 60));
                if (a.getDistanceM() != null) sb.append(String.format(", %.1f km", a.getDistanceM().doubleValue() / 1000));
                if (a.getAvgPowerW() != null) sb.append(String.format(", %d W avg", a.getAvgPowerW()));
                if (a.getAvgHeartrate() != null) sb.append(String.format(", %d bpm avg HR", a.getAvgHeartrate()));
                sb.append("\n");
            }
        } else {
            sb.append("\nNo recent activities of this type in the last 14 days.\n");
        }

        // PMC data — today's values + 7-day trend
        try {
            java.time.LocalDate today = java.time.LocalDate.now();
            DateRange range = DateRange.of(today.minusDays(7), today);
            var ctlSeries = dailyMetricRepository.findNumericSeries("ctl", range);
            var atlSeries = dailyMetricRepository.findNumericSeries("atl", range);
            var tsbSeries = dailyMetricRepository.findNumericSeries("tsb", range);

            BigDecimal ctl = ctlSeries.getOrDefault(today, BigDecimal.ZERO);
            BigDecimal atl = atlSeries.getOrDefault(today, BigDecimal.ZERO);
            BigDecimal tsb = tsbSeries.getOrDefault(today, BigDecimal.ZERO);

            sb.append(String.format("\nPerformance Management Chart (today):\n"));
            sb.append(String.format("  CTL (chronic fitness): %.0f\n", ctl.doubleValue()));
            sb.append(String.format("  ATL (acute fatigue): %.0f\n", atl.doubleValue()));
            sb.append(String.format("  TSB (form/freshness): %.0f  (%s)\n",
                    tsb.doubleValue(),
                    tsb.doubleValue() >= 5 ? "fresh — can handle intensity"
                    : tsb.doubleValue() >= -10 ? "slightly fatigued — normal training state"
                    : tsb.doubleValue() >= -25 ? "fatigued — monitor recovery"
                    : "highly fatigued — recovery priority"));

            // 7-day CTL trend
            java.time.LocalDate weekAgo = today.minusDays(7);
            BigDecimal ctlWeekAgo = ctlSeries.getOrDefault(weekAgo, BigDecimal.ZERO);
            if (ctlWeekAgo.compareTo(BigDecimal.ZERO) > 0) {
                double ctlTrend = ctl.doubleValue() - ctlWeekAgo.doubleValue();
                sb.append(String.format("  CTL trend (7 days): %+.1f (was %.0f)\n", ctlTrend, ctlWeekAgo.doubleValue()));
            }
        } catch (Exception e) {
            log.debug("Could not build PMC data for note: {}", e.getMessage());
        }

        return sb.toString();
    }

    // ------- Math helpers -------

    private int[] filterPositive(int[] data) {
        return java.util.Arrays.stream(data).filter(v -> v > 0).toArray();
    }

    private int[] filterAboveThreshold(int[] data, int threshold) {
        return java.util.Arrays.stream(data).filter(v -> v >= threshold).toArray();
    }

    private double computeAvg(int[] data) {
        if (data.length == 0) return 0;
        long sum = 0;
        for (int v : data) sum += v;
        return (double) sum / data.length;
    }

    private double computeFilteredAvgRange(int[] data, int from, int to, int minThreshold) {
        long sum = 0;
        int count = 0;
        for (int i = from; i < to; i++) {
            if (data[i] >= minThreshold) {
                sum += data[i];
                count++;
            }
        }
        return count > 0 ? (double) sum / count : 0;
    }

    private double computeStdDev(int[] data, double mean) {
        if (data.length == 0) return 0;
        double sumSq = 0;
        for (int v : data) sumSq += (v - mean) * (v - mean);
        return Math.sqrt(sumSq / data.length);
    }

    private int minVal(int[] data) {
        int min = Integer.MAX_VALUE;
        for (int v : data) if (v < min) min = v;
        return min;
    }

    private int maxVal(int[] data) {
        int max = Integer.MIN_VALUE;
        for (int v : data) if (v > max) max = v;
        return max;
    }

    /**
     * Compute Normalized Power using 30-second rolling average of 4th power.
     * Uses raw stream (including zeros) as per standard NP definition.
     */
    private double computeNormalizedPower(int[] power) {
        if (power.length < 30) {
            // Not enough data for 30s rolling avg, use simple avg of positive values
            int[] pos = filterPositive(power);
            return pos.length > 0 ? computeAvg(pos) : 0;
        }
        // 30-second rolling average (assuming ~1 sample/sec)
        double[] rolling = new double[power.length - 29];
        double windowSum = 0;
        for (int i = 0; i < 30; i++) windowSum += power[i];
        rolling[0] = windowSum / 30.0;
        for (int i = 1; i < rolling.length; i++) {
            windowSum += power[i + 29] - power[i - 1];
            rolling[i] = windowSum / 30.0;
        }
        // 4th power average
        double sum4th = 0;
        for (double r : rolling) sum4th += Math.pow(r, 4);
        return Math.pow(sum4th / rolling.length, 0.25);
    }

    // ------- Mapping -------

    private AiActivityNoteDto toDto(AiActivityNote note) {
        return AiActivityNoteDto.builder()
                .id(note.getId())
                .activityId(note.getActivityId())
                .summary(note.getSummary())
                .detail(note.getDetail())
                .modelId(note.getModelId())
                .providerName(note.getProviderName())
                .generatedAt(note.getGeneratedAt())
                .build();
    }
}
