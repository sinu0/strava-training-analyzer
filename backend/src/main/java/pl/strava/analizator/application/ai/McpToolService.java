package pl.strava.analizator.application.ai;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import pl.strava.analizator.domain.ai.AiTool;
import pl.strava.analizator.domain.ai.ToolCall;
import pl.strava.analizator.domain.ai.ToolResult;
import pl.strava.analizator.domain.model.Activity;
import pl.strava.analizator.domain.model.AthleteProfile;
import pl.strava.analizator.domain.port.ActivityRepository;
import pl.strava.analizator.domain.port.AiSqlQueryPort;
import pl.strava.analizator.domain.port.AthleteProfileRepository;
import pl.strava.analizator.domain.port.DailyMetricRepository;
import pl.strava.analizator.domain.vo.DateRange;

/**
 * Defines all tools available to the LLM and executes them when called.
 * <p>
 * Available tools:
 * <ul>
 *   <li>get_athlete_profile — FTP, weight, max HR, W/kg</li>
 *   <li>get_recent_activities — last N days of activities with key stats</li>
 *   <li>get_pmc_data — CTL/ATL/TSB series for performance management</li>
 *   <li>get_weekly_stats — weekly volume summary (hours, km, TSS)</li>
 *   <li>get_power_curve — best power for standard durations from recent activities</li>
 * </ul>
 */
@Service
public class McpToolService {

    private static final Logger log = LoggerFactory.getLogger(McpToolService.class);

    private final AthleteProfileRepository athleteProfileRepository;
    private final ActivityRepository activityRepository;
    private final DailyMetricRepository dailyMetricRepository;
    private final AiSqlQueryPort aiSqlQueryPort;

    public McpToolService(AthleteProfileRepository athleteProfileRepository,
                          ActivityRepository activityRepository,
                          DailyMetricRepository dailyMetricRepository,
                          AiSqlQueryPort aiSqlQueryPort) {
        this.athleteProfileRepository = athleteProfileRepository;
        this.activityRepository = activityRepository;
        this.dailyMetricRepository = dailyMetricRepository;
        this.aiSqlQueryPort = aiSqlQueryPort;
    }

    // ---- Tool definitions ----

    public List<AiTool> getToolDefinitions() {
        return List.of(
                AiTool.of(
                        "get_athlete_profile",
                        "Returns the athlete's profile: FTP (W), weight (kg), max HR (bpm), resting HR, W/kg.",
                        Map.of()
                ),
                AiTool.of(
                        "get_recent_activities",
                        "Returns a list of recent activities with key stats (date, type, duration, distance, avg power, avg HR, TSS).",
                        Map.of(
                                "days", Map.of("type", "integer", "description", "Number of days to look back (default 14, max 90)"),
                                "sport_type", Map.of("type", "string", "description", "Filter by sport type, e.g. 'Ride', 'Run' (optional)")
                        )
                ),
                AiTool.of(
                        "get_pmc_data",
                        "Returns Performance Management Chart data: daily CTL (chronic fitness), ATL (acute fatigue), TSB (form) for the last N days.",
                        Map.of(
                                "days", Map.of("type", "integer", "description", "Number of days of PMC history (default 14, max 90)")
                        )
                ),
                AiTool.of(
                        "get_weekly_stats",
                        "Returns weekly training volume summary: total hours, km, number of activities, and TSS per week.",
                        Map.of(
                                "weeks", Map.of("type", "integer", "description", "Number of weeks to return (default 4, max 12)")
                        )
                ),
                AiTool.of(
                        "get_power_curve",
                        "Returns best power (watts) achieved across recent activities for standard durations: 5s, 30s, 1min, 5min, 10min, 20min, 60min.",
                        Map.of(
                                "days", Map.of("type", "integer", "description", "Scan activities from last N days (default 30, max 180)")
                        )
                ),
                AiTool.of(
                        "describe_training_database_schema",
                        "Returns the application database schema with tables and columns available for AI analysis. Call this before writing SQL if the schema is unclear.",
                        Map.of()
                ),
                AiTool.of(
                        "query_training_database",
                        "Executes a single read-only SQL SELECT/CTE query against the training database. Use it for precise date-aware aggregations instead of guessing.",
                        Map.of(
                                "sql", Map.of("type", "string", "description", "Single read-only SELECT or WITH query."),
                                "max_rows", Map.of("type", "integer", "description", "Maximum rows to return (default 50, max 100).")
                        ),
                        List.of("sql")
                ),
                AiTool.of(
                        "get_activity_stream_analysis",
                        "Deep analysis of HR, power, cadence and speed streams for an activity. " +
                        "Returns: (1) segment breakdown — activity split into 4 quarters showing avg power/HR/cadence per quarter to reveal fatigue trends; " +
                        "(2) aerobic decoupling — Pw:HR ratio drift between first and second half (<5% = well-conditioned); " +
                        "(3) HR zone distribution if max HR is set; " +
                        "(4) power zone distribution with Coggan zones if FTP is set; " +
                        "(5) cadence consistency; (6) elevation impact on power. " +
                        "Call this tool for the current activity to provide deep stream-based insights.",
                        Map.of(
                                "activity_id", Map.of("type", "string",
                                        "description", "Activity UUID. Omit or pass 'current' to analyse the current session's activity.")
                        )
                )
        );
    }

    // ---- Tool execution ----

    public ToolResult execute(ToolCall call, UUID contextActivityId) {
        try {
            String content = switch (call.name()) {
                case "get_athlete_profile" -> getAthleteProfile();
                case "get_recent_activities" -> getRecentActivities(call.arguments());
                case "get_pmc_data" -> getPmcData(call.arguments());
                case "get_weekly_stats" -> getWeeklyStats(call.arguments());
                case "get_power_curve" -> getPowerCurve(call.arguments());
                case "describe_training_database_schema" -> aiSqlQueryPort.describeSchema();
                case "query_training_database" -> queryTrainingDatabase(call.arguments());
                case "get_activity_stream_analysis" -> getActivityStreamAnalysis(call.arguments(), contextActivityId);
                default -> "Unknown tool: " + call.name();
            };
            return new ToolResult(call.id(), call.name(), content);
        } catch (Exception e) {
            log.warn("Tool execution failed [{}]: {}", call.name(), e.getMessage());
            return new ToolResult(call.id(), call.name(), "Error executing tool: " + e.getMessage());
        }
    }

    // ---- Tool implementations ----

    private String getAthleteProfile() {
        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);
        if (profile == null) return "No athlete profile found.";

        StringBuilder sb = new StringBuilder("Athlete profile:\n");
        if (profile.getFtpWatts() != null) sb.append("  FTP: ").append(profile.getFtpWatts()).append(" W\n");
        if (profile.getWeightKg() != null) {
            sb.append("  Weight: ").append(profile.getWeightKg()).append(" kg\n");
            if (profile.getFtpWatts() != null && profile.getWeightKg().doubleValue() > 0) {
                double wpkg = profile.getFtpWatts() / profile.getWeightKg().doubleValue();
                sb.append(String.format("  W/kg (FTP): %.2f%n", wpkg));
            }
        }
        if (profile.getMaxHrBpm() != null) sb.append("  Max HR: ").append(profile.getMaxHrBpm()).append(" bpm\n");
        if (profile.getRestingHrBpm() != null) sb.append("  Resting HR: ").append(profile.getRestingHrBpm()).append(" bpm\n");
        if (profile.getLthrBpm() != null) sb.append("  LTHR: ").append(profile.getLthrBpm()).append(" bpm\n");
        return sb.toString();
    }

    private String getRecentActivities(Map<String, Object> args) {
        int days = intArg(args, "days", 14, 90);
        String sportFilter = stringArg(args, "sport_type", null);

        OffsetDateTime from = OffsetDateTime.now(ZoneOffset.UTC).minusDays(days);
        OffsetDateTime to = OffsetDateTime.now(ZoneOffset.UTC);
        List<Activity> activities = activityRepository.findByStartedAtBetween(from, to);

        if (sportFilter != null) {
            activities = activities.stream()
                    .filter(a -> sportFilter.equalsIgnoreCase(a.getSportType()))
                    .toList();
        }

        activities = activities.stream()
                .sorted(Comparator.comparing(Activity::getStartedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        if (activities.isEmpty()) return "No activities found in the last " + days + " days.";

        StringBuilder sb = new StringBuilder(String.format("Recent activities (last %d days):\n", days));
        for (Activity a : activities) {
            sb.append(String.format("  [%s, %s] %s — %s",
                    a.getStartedAt() != null ? a.getStartedAt().toLocalDate() : "?",
                    formatDaysAgo(a.getStartedAt()),
                    a.getSportType() != null ? a.getSportType() : "?",
                    a.getName() != null ? a.getName() : "Unnamed"));
            if (a.getMovingTimeSec() != null) sb.append(String.format(", %d min", a.getMovingTimeSec() / 60));
            if (a.getDistanceM() != null) sb.append(String.format(", %.1f km", a.getDistanceM().doubleValue() / 1000));
            if (a.getAvgPowerW() != null) sb.append(String.format(", %d W avg", a.getAvgPowerW()));
            if (a.getAvgHeartrate() != null) sb.append(String.format(", %d bpm avg HR", a.getAvgHeartrate()));
            if (a.getCalories() != null) sb.append(String.format(", %d kcal", a.getCalories()));
            sb.append("\n");
        }
        return sb.toString();
    }

    private String getPmcData(Map<String, Object> args) {
        int days = intArg(args, "days", 14, 90);
        LocalDate today = LocalDate.now();
        DateRange range = DateRange.of(today.minusDays(days), today);

        try {
            Map<LocalDate, BigDecimal> ctlSeries = dailyMetricRepository.findNumericSeries("ctl", range);
            Map<LocalDate, BigDecimal> atlSeries = dailyMetricRepository.findNumericSeries("atl", range);
            Map<LocalDate, BigDecimal> tsbSeries = dailyMetricRepository.findNumericSeries("tsb", range);

            if (ctlSeries.isEmpty()) return "No PMC data available.";

            StringBuilder sb = new StringBuilder(String.format("PMC data (last %d days):\n", days));
            sb.append(String.format("  %-12s %6s %6s %7s%n", "Date", "CTL", "ATL", "TSB"));
            ctlSeries.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(e -> {
                        LocalDate d = e.getKey();
                        double ctl = e.getValue().doubleValue();
                        double atl = atlSeries.getOrDefault(d, BigDecimal.ZERO).doubleValue();
                        double tsb = tsbSeries.getOrDefault(d, BigDecimal.ZERO).doubleValue();
                        sb.append(String.format("  %-12s %6.0f %6.0f %+7.0f%n", d, ctl, atl, tsb));
                    });
            return sb.toString();
        } catch (Exception e) {
            return "PMC data not available: " + e.getMessage();
        }
    }

    private String getWeeklyStats(Map<String, Object> args) {
        int weeks = intArg(args, "weeks", 4, 12);
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusWeeks(weeks - 1).with(DayOfWeek.MONDAY);

        // Collect activities per ISO week
        Map<String, WeekStats> weekMap = new LinkedHashMap<>();
        for (int w = weeks - 1; w >= 0; w--) {
            LocalDate weekStart = today.minusWeeks(w).with(DayOfWeek.MONDAY);
            String key = weekStart.toString();
            weekMap.put(key, new WeekStats(weekStart));
        }

        OffsetDateTime from = OffsetDateTime.now(ZoneOffset.UTC).minusWeeks(weeks);
        List<Activity> activities = activityRepository.findByStartedAtBetween(from, OffsetDateTime.now(ZoneOffset.UTC));
        Map<LocalDate, BigDecimal> dailyTss = dailyMetricRepository.findNumericSeries("daily_tss", DateRange.of(start, today));

        for (Activity a : activities) {
            if (a.getStartedAt() == null) continue;
            LocalDate date = a.getStartedAt().toLocalDate();
            LocalDate weekStart = date.with(DayOfWeek.MONDAY);
            WeekStats ws = weekMap.get(weekStart.toString());
            if (ws == null) continue;
            ws.count++;
            if (a.getMovingTimeSec() != null) ws.totalMinutes += a.getMovingTimeSec() / 60;
            if (a.getDistanceM() != null) ws.totalKm += a.getDistanceM().doubleValue() / 1000;
        }

        dailyTss.forEach((date, tss) -> {
            LocalDate weekStart = date.with(DayOfWeek.MONDAY);
            WeekStats ws = weekMap.get(weekStart.toString());
            if (ws != null) {
                ws.totalTss = ws.totalTss.add(tss);
            }
        });

        StringBuilder sb = new StringBuilder(String.format("Weekly stats (last %d weeks):\n", weeks));
        sb.append(String.format("  %-12s %8s %8s %9s %8s%n", "Week", "Hours", "Km", "Activities", "TSS"));
        for (WeekStats ws : weekMap.values()) {
            sb.append(String.format("  %-12s %8.1f %8.1f %9d %8.1f%n",
                    ws.start, ws.totalMinutes / 60.0, ws.totalKm, ws.count, ws.totalTss.doubleValue()));
        }
        return sb.toString();
    }

    private String queryTrainingDatabase(Map<String, Object> args) {
        String sql = stringArg(args, "sql", null);
        int maxRows = intArg(args, "max_rows", 50, 100);
        return aiSqlQueryPort.executeReadOnlySql(sql, maxRows);
    }

    private String getPowerCurve(Map<String, Object> args) {
        int days = intArg(args, "days", 30, 180);
        OffsetDateTime from = OffsetDateTime.now(ZoneOffset.UTC).minusDays(days);
        List<Activity> activities = activityRepository.findByStartedAtBetween(from, OffsetDateTime.now(ZoneOffset.UTC));

        // Standard durations in seconds
        int[] durations = {5, 30, 60, 300, 600, 1200, 3600};
        int[] bestPower = new int[durations.length];

        for (Activity a : activities) {
            if (a.getPowerStream() == null || a.getPowerStream().length < 10) continue;
            int[] power = a.getPowerStream();
            for (int di = 0; di < durations.length; di++) {
                int dur = durations[di];
                if (power.length < dur) continue;
                // Sliding window average
                long windowSum = 0;
                for (int i = 0; i < dur; i++) windowSum += power[i];
                long best = windowSum;
                for (int i = dur; i < power.length; i++) {
                    windowSum += power[i] - power[i - dur];
                    if (windowSum > best) best = windowSum;
                }
                int avgBest = (int) (best / dur);
                if (avgBest > bestPower[di]) bestPower[di] = avgBest;
            }
        }

        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);
        Integer ftp = (profile != null && profile.getFtpWatts() != null) ? (int) profile.getFtpWatts() : null;

        String[] labels = {"5s", "30s", "1min", "5min", "10min", "20min", "60min"};
        StringBuilder sb = new StringBuilder(String.format("Power curve (best efforts, last %d days):\n", days));
        for (int i = 0; i < labels.length; i++) {
            if (bestPower[i] > 0) {
                sb.append(String.format("  %5s: %d W", labels[i], bestPower[i]));
                if (ftp != null && ftp > 0) {
                    sb.append(String.format(" (%.0f%% FTP)", 100.0 * bestPower[i] / ftp));
                }
                sb.append("\n");
            }
        }
        return bestPower[0] == 0 ? "No power data available in the last " + days + " days." : sb.toString();
    }

    private String getActivityStreamAnalysis(Map<String, Object> args, UUID contextActivityId) {
        // Resolve which activity to analyse
        UUID targetId = contextActivityId;
        String idArg = stringArg(args, "activity_id", null);
        if (idArg != null && !idArg.isBlank() && !"current".equalsIgnoreCase(idArg)) {
            try { targetId = UUID.fromString(idArg); } catch (IllegalArgumentException ignored) {}
        }
        if (targetId == null) return "No activity context available.";

        Activity a = activityRepository.findById(targetId).orElse(null);
        if (a == null) return "Activity not found: " + targetId;

        AthleteProfile profile = athleteProfileRepository.findFirst().orElse(null);
        Integer ftp = (profile != null && profile.getFtpWatts() != null) ? (int) profile.getFtpWatts() : null;
        Integer maxHr = (profile != null && profile.getMaxHrBpm() != null) ? (int) profile.getMaxHrBpm() : null;

        StringBuilder sb = new StringBuilder();
        sb.append("Activity stream analysis: ").append(a.getName() != null ? a.getName() : targetId).append("\n");

        // ---- 1. Quarter segment breakdown ----
        int[] timeStream = a.getTimeStream();
        int[] powerStream = a.getPowerStream();
        int[] hrStream = a.getHeartrateStream();
        int[] cadenceStream = a.getCadenceStream();

        int len = timeStream != null ? timeStream.length
                : powerStream != null ? powerStream.length
                : hrStream != null ? hrStream.length : 0;

        if (len > 40) {
            sb.append("\nQuarter-by-quarter breakdown (fatigue / progression):\n");
            sb.append(String.format("  %-10s %10s %8s %10s%n", "Segment", "Avg Power", "Avg HR", "Avg Cadence"));
            int q = len / 4;
            String[] qLabels = {"Q1 (0-25%)", "Q2 (25-50%)", "Q3 (50-75%)", "Q4 (75-100%)"};
            for (int qi = 0; qi < 4; qi++) {
                int from = qi * q;
                int to = (qi == 3) ? len : (qi + 1) * q;
                String pwStr = segmentAvg(powerStream, from, to, 0) > 0
                        ? String.format("%.0f W", segmentAvg(powerStream, from, to, 0)) : "N/A";
                String hrStr = segmentAvg(hrStream, from, to, 40) > 0
                        ? String.format("%.0f bpm", segmentAvg(hrStream, from, to, 40)) : "N/A";
                String cadStr = segmentAvg(cadenceStream, from, to, 1) > 0
                        ? String.format("%.0f rpm", segmentAvg(cadenceStream, from, to, 1)) : "N/A";
                sb.append(String.format("  %-10s %10s %8s %10s%n", qLabels[qi], pwStr, hrStr, cadStr));
            }
        }

        // ---- 2. Aerobic decoupling (Pw:HR) ----
        if (powerStream != null && hrStream != null && len > 40) {
            int half = len / 2;
            double pwH1 = segmentAvg(powerStream, 0, half, 0);
            double hrH1 = segmentAvg(hrStream, 0, half, 40);
            double pwH2 = segmentAvg(powerStream, half, len, 0);
            double hrH2 = segmentAvg(hrStream, half, len, 40);
            if (pwH1 > 0 && hrH1 > 0 && pwH2 > 0 && hrH2 > 0) {
                double ratio1 = pwH1 / hrH1;
                double ratio2 = pwH2 / hrH2;
                double decoupling = 100.0 * (ratio2 - ratio1) / ratio1;
                sb.append(String.format("%nAerobic decoupling (Pw:HR):%n"));
                sb.append(String.format("  First half:  %.0f W / %.0f bpm = ratio %.3f%n", pwH1, hrH1, ratio1));
                sb.append(String.format("  Second half: %.0f W / %.0f bpm = ratio %.3f%n", pwH2, hrH2, ratio2));
                sb.append(String.format("  Drift: %+.1f%% ", decoupling));
                if (Math.abs(decoupling) < 5) sb.append("(Good — aerobically efficient)\n");
                else if (decoupling < 0) sb.append("(Power held with lower HR — possibly downhill/tailwind or getting warmed up)\n");
                else sb.append("(HR drifted up relative to power — cardiac fatigue or thermal stress)\n");
            }
        } else if (hrStream != null && len > 40) {
            // HR drift without power
            int half = len / 2;
            double hrH1 = segmentAvg(hrStream, 0, half, 40);
            double hrH2 = segmentAvg(hrStream, half, len, 40);
            if (hrH1 > 0 && hrH2 > 0) {
                double drift = 100.0 * (hrH2 - hrH1) / hrH1;
                sb.append(String.format("%nHR drift (first vs second half): %+.1f%% (%.0f → %.0f bpm)%n",
                        drift, hrH1, hrH2));
                if (drift > 8) sb.append("  Warning: large HR drift suggests fatigue or thermal stress.\n");
            }
        }

        // ---- 3. HR zones ----
        if (hrStream != null && hrStream.length > 10 && maxHr != null && maxHr > 0) {
            int z1 = 0, z2 = 0, z3 = 0, z4 = 0, z5 = 0;
            for (int hr : hrStream) {
                if (hr < 40) continue;
                double pct = 100.0 * hr / maxHr;
                if (pct < 60) z1++;
                else if (pct < 70) z2++;
                else if (pct < 80) z3++;
                else if (pct < 90) z4++;
                else z5++;
            }
            int total = z1 + z2 + z3 + z4 + z5;
            if (total > 0) {
                sb.append(String.format("%nHR zones (%% max HR = %d bpm):%n", maxHr));
                sb.append(String.format("  Z1 Recovery (<60%%): %.0f%%%n", 100.0 * z1 / total));
                sb.append(String.format("  Z2 Aerobic (60-70%%): %.0f%%%n", 100.0 * z2 / total));
                sb.append(String.format("  Z3 Tempo (70-80%%): %.0f%%%n", 100.0 * z3 / total));
                sb.append(String.format("  Z4 Threshold (80-90%%): %.0f%%%n", 100.0 * z4 / total));
                sb.append(String.format("  Z5 Maximal (>90%%): %.0f%%%n", 100.0 * z5 / total));
            }
        }

        // ---- 4. Power zones ----
        if (powerStream != null && powerStream.length > 10 && ftp != null && ftp > 0) {
            int z1 = 0, z2 = 0, z3 = 0, z4 = 0, z5 = 0, z6 = 0, z7 = 0;
            for (int p : powerStream) {
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
                sb.append(String.format("%nCoggan power zones (%% FTP = %d W):%n", ftp));
                sb.append(String.format("  Z1 Recovery (<55%%):   %.0f%%%n", 100.0 * z1 / total));
                sb.append(String.format("  Z2 Endurance (55-75%%): %.0f%%%n", 100.0 * z2 / total));
                sb.append(String.format("  Z3 Tempo (75-90%%):     %.0f%%%n", 100.0 * z3 / total));
                sb.append(String.format("  Z4 Threshold (90-105%%):%.0f%%%n", 100.0 * z4 / total));
                sb.append(String.format("  Z5 VO2max (105-120%%):  %.0f%%%n", 100.0 * z5 / total));
                sb.append(String.format("  Z6 Anaerobic (120-150%%):%.0f%%%n", 100.0 * z6 / total));
                sb.append(String.format("  Z7 Sprint (>150%%):     %.0f%%%n", 100.0 * z7 / total));
            }
        }

        // ---- 5. Cadence consistency ----
        if (cadenceStream != null && cadenceStream.length > 10) {
            int active = 0;
            double sum = 0;
            for (int c : cadenceStream) {
                if (c > 0) { sum += c; active++; }
            }
            if (active > 0) {
                double avg = sum / active;
                double pedPct = 100.0 * active / cadenceStream.length;
                sb.append(String.format("%nCadence: avg %.0f rpm when pedalling, pedalling %.0f%% of time%n", avg, pedPct));
                if (avg < 75) sb.append("  Note: low cadence — consider spinning up, may increase muscular fatigue.\n");
                else if (avg > 95) sb.append("  Note: high cadence — good neuromuscular efficiency.\n");
            }
        }

        // ---- 6. Elevation-power interaction ----
        if (a.getAltitudeStream() != null && powerStream != null && a.getAltitudeStream().length == powerStream.length) {
            double[] alt = a.getAltitudeStream();
            double climbPowerSum = 0; int climbCount = 0;
            double flatPowerSum = 0; int flatCount = 0;
            for (int i = 1; i < alt.length; i++) {
                double gradient = alt[i] - alt[i - 1]; // 1-sec diff ≈ gradient proxy
                int p = powerStream[i];
                if (p <= 0) continue;
                if (gradient > 0.5) { climbPowerSum += p; climbCount++; }
                else if (Math.abs(gradient) <= 0.5) { flatPowerSum += p; flatCount++; }
            }
            if (climbCount > 60 && flatCount > 60) {
                sb.append(String.format("%nPower on climbs vs flat:%n"));
                sb.append(String.format("  Climbing avg power: %.0f W%n", climbPowerSum / climbCount));
                sb.append(String.format("  Flat avg power:     %.0f W%n", flatPowerSum / flatCount));
            }
        }

        return sb.toString();
    }

    /** Average of stream values above threshold, between indices [from, to). Returns 0 if no valid data. */
    private double segmentAvg(int[] stream, int from, int to, int minThreshold) {
        if (stream == null) return 0;
        to = Math.min(to, stream.length);
        double sum = 0; int count = 0;
        for (int i = from; i < to; i++) {
            if (stream[i] > minThreshold) { sum += stream[i]; count++; }
        }
        return count > 0 ? sum / count : 0;
    }

    // ---- Helpers ----

    private int intArg(Map<String, Object> args, String key, int defaultVal, int max) {
        if (args == null || !args.containsKey(key)) return defaultVal;
        try {
            int v = ((Number) args.get(key)).intValue();
            return Math.min(Math.max(1, v), max);
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private String stringArg(Map<String, Object> args, String key, String defaultVal) {
        if (args == null || !args.containsKey(key)) return defaultVal;
        Object v = args.get(key);
        return v != null ? v.toString() : defaultVal;
    }

    private String formatDaysAgo(OffsetDateTime startedAt) {
        if (startedAt == null) {
            return "unknown age";
        }
        long daysAgo = ChronoUnit.DAYS.between(startedAt.toLocalDate(), LocalDate.now(ZoneOffset.UTC));
        if (daysAgo <= 0) {
            return "today";
        }
        return daysAgo + "d ago";
    }

    private static class WeekStats {
        final LocalDate start;
        int count;
        int totalMinutes;
        double totalKm;
        BigDecimal totalTss = BigDecimal.ZERO;

        WeekStats(LocalDate start) {
            this.start = start;
        }
    }
}
