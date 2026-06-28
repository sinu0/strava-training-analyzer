package pl.strava.analizator.domain.ai;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Aggregated training context prepared for LLM consumption.
 * Contains all relevant historical data the model needs to make predictions.
 */
@Getter
@Builder
@AllArgsConstructor
public class TrainingContext {

    private String athleteProfile;
    private String timeContext;
    private List<String> recentActivities;
    private Map<String, Object> pmcData;
    private Map<String, Object> ftpHistory;
    private Map<String, Object> weeklyVolume;
    private Map<String, Object> zoneDistribution;
    private Map<String, Object> readiness;
    private Map<String, Object> powerCurve;
    private Map<String, Object> durability;
    private Map<String, Object> progressionLevels;
    private Map<String, Object> blockHealth;
    private Map<String, Object> programReview;
    private Map<String, Object> coachSummary;
    private Map<String, Object> coachMemory;
    /** Recent past predictions for this type — gives model historical context to avoid repetition */
    private List<String> recentPredictionHistory;
    /** Race pacing: race distance, elevation, target time */
    private Map<String, Object> raceProfile;
    /** Nutrition: planned activity details */
    private Map<String, Object> plannedActivity;
    /** Peak timing: target event date */
    private String eventDate;
    /** Nutrition: weather conditions for ride */
    private Map<String, Object> weatherConditions;
    /** Athlete's personal journal entries */
    private String journalEntries;
    /** Mood trend from journal */
    private String journalMoodTrend;
}
