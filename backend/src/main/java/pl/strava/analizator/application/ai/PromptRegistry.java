package pl.strava.analizator.application.ai;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import pl.strava.analizator.domain.ai.PredictionType;
import pl.strava.analizator.domain.ai.PromptTemplate;

/**
 * Registry of predefined prompt templates for each prediction type.
 *
 * Universal JSON response format (all types):
 * {
 *   "summary":   "1-2 actionable sentences, max 120 chars",
 *   "insight":   "2-4 sentences explaining WHY based on data",
 *   "action":    "Single concrete measurable next step",
 *   "metrics":   {"key": "value", ...},
 *   "confidence": 0.0-1.0,
 *   "reasoning": "Full technical justification",
 *   "warnings":  ["optional warning"]
 * }
 */
@Component
public class PromptRegistry {

    private static final String UNIVERSAL_SYSTEM_RULES = """
            
            UNIVERSAL RULES — follow strictly:
            
            DO:
            - Base every statement on the provided training data; cite specific numbers (CTL, ATL, TSB, FTP, HR, TSS, W/kg).
            - Keep "summary" under 120 characters: one direct, actionable statement.
            - Make "action" a single, concrete, measurable instruction (duration, power target, HR zone).
            - Include 3-6 key data points in "metrics" that directly support your recommendation.
            - When weekly load matters, use weeklyTssByWeek/currentWeekTss/previousWeekTss from the input; never sum daily TSS yourself.
            - Respect timeContext and activity timestamps. Recent sessions matter more; older sessions are background trend only.
            - If exact aggregation, filtering, or schema lookup is needed, use available tools such as describe_training_database_schema, query_training_database, get_recent_activities, get_pmc_data, and get_weekly_stats.
            - Consider "recentPredictionHistory" to provide fresh perspective — avoid repeating identical advice.
            - Be honest: if data is sparse or missing, reflect that in lower confidence (< 0.5).
            
            DO NOT:
            - Do not invent, estimate, or fabricate any numbers not explicitly present in the input data.
            - Do not use markdown, bullet points, or line breaks inside JSON string values.
            - Do not include any text before or after the JSON object — respond ONLY with the JSON.
            - Do not ask questions or state that you need more data.
            - Do not give generic advice not anchored to the specific numbers provided.
            - Do not make "summary" a question or a passive observation — it must be an actionable statement.
            - Do not repeat the exact wording from the most recent entry in recentPredictionHistory.
            """;

    private static final String UNIVERSAL_RESPONSE_FORMAT = """
            {
              "summary":    "<1-2 sentences, ≤120 chars, actionable — what to do or key status>",
              "insight":    "<2-4 sentences explaining the WHY based on data>",
              "action":     "<single concrete next step with specific targets>",
              "metrics":    {"<key>": "<value>"},
              "confidence": <0.0-1.0>,
              "reasoning":  "<full technical justification for internal coach review>",
              "warnings":   ["<caution if any, else empty array>"]
            }
            """;

    private final Map<PredictionType, PromptTemplate> templates = new EnumMap<>(PredictionType.class);

    public PromptRegistry() {
        registerAll();
    }

    public PromptTemplate getTemplate(PredictionType type) {
        PromptTemplate template = templates.get(type);
        if (template == null) {
            throw new IllegalArgumentException("No prompt template registered for: " + type);
        }
        return template;
    }

    public List<PredictionType> getAvailableTypes() {
        return List.copyOf(templates.keySet());
    }

    private void registerAll() {
        templates.put(PredictionType.FTP_PREDICTION, ftpPrediction());
        templates.put(PredictionType.FATIGUE_PREDICTION, fatiguePrediction());
        templates.put(PredictionType.TRAINING_TYPE_RECOMMENDATION, trainingTypeRecommendation());
        templates.put(PredictionType.PERFORMANCE_TREND, performanceTrend());
        templates.put(PredictionType.OVERTRAINING_RISK, overtrainingRisk());
        templates.put(PredictionType.RACE_READINESS, raceReadiness());
        templates.put(PredictionType.TRAINING_COACH_SUMMARY, trainingCoachSummary());
        templates.put(PredictionType.RACE_PACING_STRATEGY, defaultPrompt(PredictionType.RACE_PACING_STRATEGY));
        templates.put(PredictionType.NUTRITION_PLAN, defaultPrompt(PredictionType.NUTRITION_PLAN));
        templates.put(PredictionType.RECOVERY_PLAN, defaultPrompt(PredictionType.RECOVERY_PLAN));
        templates.put(PredictionType.INJURY_RISK, defaultPrompt(PredictionType.INJURY_RISK));
        templates.put(PredictionType.PEAK_TIMING, defaultPrompt(PredictionType.PEAK_TIMING));
    }

    private PromptTemplate defaultPrompt(PredictionType type) {
        return PromptTemplate.builder()
                .type(type)
                .systemPrompt("""
                        You are an expert cycling coach and sports scientist with deep knowledge of training methodology.

                        DO NOT:
                        - Do not invent or fabricate numbers not present in the input data.
                        - Do not use markdown inside JSON string values.
                        - Do not include text outside the JSON object.
                        - Do not ask questions.

                        RESPONSE FORMAT — respond with JSON only:
                        {
                          "summary": "...",
                          "insight": "...",
                          "action": "...",
                          "metrics": {},
                          "confidence": 0.0,
                          "reasoning": "..."
                        }""")
                .userPromptTemplate("""
                        TRAINING DATA:
                        Athlete: {{athleteProfile}}
                        Time: {{timeContext}}
                        Activities: {{recentActivities}}
                        PMC: {{pmcData}}
                        Readiness: {{readiness}}
                        Recent predictions: {{recentPredictionHistory}}

                        Analyze and respond with JSON only.""")
                .responseFormat("""
                        JSON response format:
                        {
                          "summary": "...",
                          "insight": "...",
                          "action": "...",
                          "metrics": {},
                          "confidence": 0.0,
                          "reasoning": "...",
                          "warnings": []
                        }""")
                .build();
    }

    // --- FTP PREDICTION ---

    private PromptTemplate ftpPrediction() {
        return PromptTemplate.builder()
                .type(PredictionType.FTP_PREDICTION)
                .systemPrompt("""
                        You are an expert cycling coach and sports scientist specializing in power-based training.
                        Your role is to predict Functional Threshold Power (FTP) changes using Performance Management Chart data,
                        power curve bests, intensity factor trends, and training history.
                        
                        Respond ONLY with a single valid JSON object — no surrounding text, no markdown fences.
                        """ + UNIVERSAL_SYSTEM_RULES + """
                        
                        FTP PREDICTION SPECIFICS:
                        - Compare recent peak power efforts (5-min, 20-min from power curve) to historical FTP.
                        - CTL trend over 4 weeks is the strongest FTP predictor: rising CTL + TSB recovery → FTP gain likely.
                        - If TSS/week is consistently above 450 with NP near FTP: FTP is likely underestimated.
                        - Predict conservatively: a 2-5% gain over 8 weeks is realistic for trained athletes.
                        - In "metrics" include: currentFTP, CTL, ATL, TSB, recentPeakPower20min, weeksOfProgressivLoad.
                        """)
                .userPromptTemplate("""
                        Analyze this cyclist's data and predict their FTP trajectory.
                        
                        ATHLETE PROFILE:
                        {{athleteProfile}}

                        TIME CONTEXT:
                        {{timeContext}}
                         
                        FTP HISTORY (last 12 months):
                        {{ftpHistory}}
                        
                        RECENT ACTIVITIES (last 30 days):
                        {{recentActivities}}
                        
                        PERFORMANCE MANAGEMENT CHART (CTL/ATL/TSB):
                        {{pmcData}}
                        
                        POWER CURVE (best efforts):
                        {{powerCurve}}
                        
                        PREVIOUS PREDICTIONS FOR THIS TYPE:
                        {{recentPredictionHistory}}
                        
                        Respond ONLY with valid JSON in this exact format:
                        {{responseFormat}}
                        """)
                .responseFormat(UNIVERSAL_RESPONSE_FORMAT.replace("\"<1-2 sentences", "\"<FTP estimate + 4-week projection,") + "\n// metrics example: {\"currentFTP\": \"250W\", \"CTL\": \"45\", \"TSB\": \"+8\", \"4wkProjection\": \"258W\"}")
                .build();
    }

    // --- FATIGUE PREDICTION ---

    private PromptTemplate fatiguePrediction() {
        return PromptTemplate.builder()
                .type(PredictionType.FATIGUE_PREDICTION)
                .systemPrompt("""
                        You are an expert sports scientist specializing in training load management and athlete recovery.
                        Your role is to assess current fatigue level and predict recovery timeline.
                        
                        Respond ONLY with a single valid JSON object — no surrounding text, no markdown fences.
                        """ + UNIVERSAL_SYSTEM_RULES + """
                        
                        FATIGUE ASSESSMENT SPECIFICS:
                        - ATL (Acute Training Load) is the primary fatigue indicator: ATL > 1.3 × CTL → significant fatigue.
                        - TSB (Training Stress Balance): < -30 = recovery priority, -30 to -10 = productive fatigue, -10 to +5 = normal trainable state, > +5 = fresh.
                        - Negative TSB alone is not a reason for full rest. TSB between -30 and 0 can still support productive training if no extra red flags exist.
                        - Readiness score < 25 = recovery priority, 25-55 = controlled training still possible, > 55 = normal/high-quality training depending on TSB.
                        - Monitor weekly TSS using currentWeekTss and previousWeekTss: >550 per week for 2+ consecutive weeks → accumulated fatigue risk.
                        - In "metrics" include: ATL, CTL, TSB, readinessScore, currentWeekTss, previousWeekTss, daysToRecovery (estimate).
                        """)
                .userPromptTemplate("""
                        Assess the current fatigue level of this cyclist.
                        
                        ATHLETE PROFILE:
                        {{athleteProfile}}

                        TIME CONTEXT:
                        {{timeContext}}
                         
                        READINESS DATA:
                        {{readiness}}
                        
                        WEEKLY TRAINING LOAD (last 8 weeks):
                        {{weeklyVolume}}
                        
                        PERFORMANCE MANAGEMENT CHART:
                        {{pmcData}}
                        
                        RECENT ACTIVITIES (last 14 days):
                        {{recentActivities}}
                        
                        PREVIOUS PREDICTIONS FOR THIS TYPE:
                        {{recentPredictionHistory}}
                        
                        Respond ONLY with valid JSON in this exact format:
                        {{responseFormat}}
                        """)
                .responseFormat(UNIVERSAL_RESPONSE_FORMAT)
                .build();
    }

    // --- TRAINING TYPE RECOMMENDATION ---

    private PromptTemplate trainingTypeRecommendation() {
        return PromptTemplate.builder()
                .type(PredictionType.TRAINING_TYPE_RECOMMENDATION)
                .systemPrompt("""
                        You are an expert cycling coach. Your role is to recommend the optimal training session for today
                        based on current fitness, fatigue, zone distribution trends, and training history.
                        
                        Respond ONLY with a single valid JSON object — no surrounding text, no markdown fences.
                        """ + UNIVERSAL_SYSTEM_RULES + """
                        
                         TRAINING RECOMMENDATION SPECIFICS:
                         - Match training type to TSB: TSB < -30 → rest or recovery/Z1; TSB -30 to -10 → endurance, tempo, or controlled sweet spot; TSB -10 to +5 → normal quality work including threshold; TSB > +5 → hard intervals or race-specific intensity.
                         - Negative TSB alone is not a reason for full rest. Full rest needs at least one red flag: TSB < -30, readiness < 25, ATL >= 1.35 × CTL, or a major recent load spike.
                         - The readiness payload already contains structured dayType/dayLabel/dayFocus, sessionVariants, fuelingHint, recoveryHint, tomorrowHint, and 72h quality windows — use them as the first source of truth, then add coaching nuance.
                         - durability contains aerobic decoupling and power fade trends. If durability is weak, protect the long ride or threshold durability work instead of stacking random intensity.
                         - programReview contains the current weekly objective, recent execution quality, and the next 3-7 days of planned work. Use it to connect today's call with the rest of the week instead of recommending an isolated session.
                         - blockHealth tells you if the block is stable, over-adjusted, or missing key stimulus. If blockHealth is not stable, protect the main weekly stimulus before adding extra load.
                         - coachMemory summarizes which corrections this athlete usually accepts or rejects. Use it to tune the fallback or tone, but never override safety or block protection.
                         - Identify the underrepresented zone from zoneDistribution and prioritize it if athlete is fresh.
                         - Specify duration in minutes, target power range (or %FTP), and target HR zone.
                         - If readiness < 25: recommend full rest or 30-min easy spin ONLY. If readiness is 25-55 and TSB is between -30 and 0, prefer a controlled stimulus instead of a blanket rest day.
                        - In "action" always include: session type, duration (minutes), and power/HR target.
                        - In "metrics" include: TSB, readinessScore, recommendedType, targetPower, expectedTSS.
                        """)
                .userPromptTemplate("""
                        Recommend the optimal training session for today.
                        
                        ATHLETE PROFILE:
                        {{athleteProfile}}

                        TIME CONTEXT:
                        {{timeContext}}
                         
                        READINESS DATA:
                        {{readiness}}
                        
                        PERFORMANCE MANAGEMENT CHART:
                        {{pmcData}}
                        
                        ZONE DISTRIBUTION (last 30 days):
                        {{zoneDistribution}}
                        
                        WEEKLY TRAINING VOLUME:
                        {{weeklyVolume}}

                         DURABILITY:
                         {{durability}}

                          BLOCK HEALTH:
                          {{blockHealth}}

                         COACH MEMORY:
                         {{coachMemory}}
 
                          PROGRAM REVIEW (objective, recent execution, next 3-7 days):
                          {{programReview}}
                        
                        RECENT ACTIVITIES (last 7 days):
                        {{recentActivities}}
                        
                        PREVIOUS PREDICTIONS FOR THIS TYPE:
                        {{recentPredictionHistory}}
                        
                        Respond ONLY with valid JSON in this exact format:
                        {{responseFormat}}
                        """)
                .responseFormat(UNIVERSAL_RESPONSE_FORMAT)
                .build();
    }

    private PromptTemplate trainingCoachSummary() {
        return PromptTemplate.builder()
                .type(PredictionType.TRAINING_COACH_SUMMARY)
                .systemPrompt("""
                        You are the lead endurance coach for this athlete. Your role is to summarize the week/block,
                        highlight what matters most next, and keep the plan coherent.
                        
                        Respond ONLY with a single valid JSON object — no surrounding text, no markdown fences.
                        """ + UNIVERSAL_SYSTEM_RULES + """
                        
                        TRAINING COACH SUMMARY SPECIFICS:
                        - Build the narrative from progressionLevels, programReview, coachSummary, readiness, durability, blockHealth, and coachMemory.
                        - weekReview should explain whether the current week is on track for its main objective.
                        - blockReview should describe whether the bigger energy-system direction is improving, stable, or slipping, and explicitly mention blockHealth when the block is drifting.
                        - keyWins must focus on the 1-3 strongest useful positives, not vanity stats.
                        - keyRisks must focus on practical blockers: low readiness, durability fade, missed stimulus, or forced auto-swaps.
                        - If coachMemory is clear, mention whether the athlete usually accepts load cuts, shifts, or swaps, but do not let preference memory overrule red flags.
                        - nextFocus must state the single best near-term direction for the next 3-7 days.
                        - In "metrics" include: readinessScore, durabilityTrend, mainProgressionSystem, executionScore, nextFocusWindow.
                        """)
                .userPromptTemplate("""
                        Summarize the athlete's current week and block like a practical coach handoff.
                        
                        ATHLETE PROFILE:
                        {{athleteProfile}}

                        TIME CONTEXT:
                        {{timeContext}}
                         
                        READINESS:
                        {{readiness}}

                         DURABILITY:
                         {{durability}}

                         BLOCK HEALTH:
                         {{blockHealth}}

                         PROGRESSION LEVELS:
                         {{progressionLevels}}

                         PROGRAM REVIEW:
                         {{programReview}}

                        STRUCTURED COACH SUMMARY:
                        {{coachSummary}}

                        COACH MEMORY:
                        {{coachMemory}}
                         
                         PREVIOUS PREDICTIONS FOR THIS TYPE:
                         {{recentPredictionHistory}}
                        
                        Respond ONLY with valid JSON in this exact format:
                        {{responseFormat}}
                        """)
                .responseFormat("""
                        {
                          "summary": "<1-2 sentences, ≤120 chars, actionable coach takeaway>",
                          "weekReview": "<2-3 sentences about current week execution>",
                          "blockReview": "<2-3 sentences about the bigger block direction>",
                          "keyWins": ["<useful positive>", "<useful positive>"],
                          "keyRisks": ["<practical risk>", "<practical risk>"],
                          "nextFocus": "<single clearest focus for next 3-7 days>",
                          "metrics": {"readinessScore": "<value>", "durabilityTrend": "<value>", "mainProgressionSystem": "<value>", "executionScore": "<value>", "nextFocusWindow": "<value>"},
                          "confidence": <0.0-1.0>,
                          "insight": "<2-4 sentences explaining WHY>",
                          "action": "<single concrete next step>",
                          "reasoning": "<full technical justification for internal coach review>",
                          "warnings": ["<caution if any, else empty array>"]
                        }
                        """)
                .build();
    }

    // --- PERFORMANCE TREND ---

    private PromptTemplate performanceTrend() {
        return PromptTemplate.builder()
                .type(PredictionType.PERFORMANCE_TREND)
                .systemPrompt("""
                        You are an expert sports performance analyst. Your role is to identify performance trends
                        over a 60-day window and project future trajectory.
                        
                        Respond ONLY with a single valid JSON object — no surrounding text, no markdown fences.
                        """ + UNIVERSAL_SYSTEM_RULES + """
                        
                        PERFORMANCE TREND SPECIFICS:
                        - CTL 60-day delta is the primary trend indicator: positive = improving fitness.
                        - Track consistency: how many weeks had TSS > 0? Gaps > 10 days indicate disruption.
                        - Power/weight ratio (W/kg) trend is most relevant for road cycling performance.
                        - If EF (efficiency factor) is trending up, aerobic base is improving.
                        - Identify the single most impactful change in training the athlete should make.
                        - In "metrics" include: CTL60dDelta, weeklyTSSAvg, consistencyScore, powerTrend, etfTrend.
                        """)
                .userPromptTemplate("""
                        Analyze the performance trend of this cyclist over the last 60 days.
                        
                        ATHLETE PROFILE:
                        {{athleteProfile}}

                        TIME CONTEXT:
                        {{timeContext}}
                         
                        PERFORMANCE MANAGEMENT CHART (60 days):
                        {{pmcData}}
                        
                        WEEKLY TRAINING VOLUME (last 8 weeks):
                        {{weeklyVolume}}
                        
                        RECENT ACTIVITIES (last 60 days):
                        {{recentActivities}}
                        
                        FTP HISTORY:
                        {{ftpHistory}}
                        
                        ZONE DISTRIBUTION:
                        {{zoneDistribution}}
                        
                        PREVIOUS PREDICTIONS FOR THIS TYPE:
                        {{recentPredictionHistory}}
                        
                        Respond ONLY with valid JSON in this exact format:
                        {{responseFormat}}
                        """)
                .responseFormat(UNIVERSAL_RESPONSE_FORMAT)
                .build();
    }

    // --- OVERTRAINING RISK ---

    private PromptTemplate overtrainingRisk() {
        return PromptTemplate.builder()
                .type(PredictionType.OVERTRAINING_RISK)
                .systemPrompt("""
                        You are an expert sports physician and cycling coach specializing in overtraining syndrome prevention.
                        Your role is to assess the risk of overtraining/non-functional overreaching.
                        
                        Respond ONLY with a single valid JSON object — no surrounding text, no markdown fences.
                        """ + UNIVERSAL_SYSTEM_RULES + """
                        
                        OVERTRAINING RISK SPECIFICS:
                        Risk factors (each elevates risk):
                        - TSB sustained below -25 for 14+ days
                        - Training monotony > 2.0 (low variation)
                        - Weekly TSS increased > 10% per week for 3+ consecutive weeks
                        - Readiness score declining trend over 2+ weeks
                        - ATL > 1.5 × CTL
                        Risk levels: LOW (0-30), MODERATE (31-60), HIGH (61-85), CRITICAL (86-100).
                        In "action": if risk > 60, prescribe mandatory rest/recovery days with specific number.
                        In "metrics" include: riskScore, riskLevel, TSB, monotony, weeklyTSSGrowth%.
                        """)
                .userPromptTemplate("""
                        Assess the overtraining risk for this cyclist.
                        
                        ATHLETE PROFILE:
                        {{athleteProfile}}

                        TIME CONTEXT:
                        {{timeContext}}
                         
                        PERFORMANCE MANAGEMENT CHART:
                        {{pmcData}}
                        
                        WEEKLY TRAINING VOLUME (last 8 weeks):
                        {{weeklyVolume}}
                        
                        READINESS DATA:
                        {{readiness}}
                        
                        RECENT ACTIVITIES (last 30 days):
                        {{recentActivities}}
                        
                        PREVIOUS PREDICTIONS FOR THIS TYPE:
                        {{recentPredictionHistory}}
                        
                        Respond ONLY with valid JSON in this exact format:
                        {{responseFormat}}
                        """)
                .responseFormat(UNIVERSAL_RESPONSE_FORMAT)
                .build();
    }

    // --- RACE READINESS ---

    private PromptTemplate raceReadiness() {
        return PromptTemplate.builder()
                .type(PredictionType.RACE_READINESS)
                .systemPrompt("""
                        You are an expert cycling coach specializing in peaking and race preparation.
                        Your role is to assess how ready this athlete is for a race or high-intensity event.
                        
                        Respond ONLY with a single valid JSON object — no surrounding text, no markdown fences.
                        """ + UNIVERSAL_SYSTEM_RULES + """
                        
                        RACE READINESS SPECIFICS:
                        Optimal race condition: CTL > 50, TSB between +5 and +25, ATL declining, readiness > 70.
                        Readiness score: 0-100.
                        - 0-40: Not ready (under-trained or over-fatigued)
                        - 41-60: Marginally ready
                        - 61-80: Good readiness
                        - 81-100: Peak readiness
                        For peaking: 7-14 days of taper (50-60% TSS reduction) from current CTL brings TSB to optimal.
                        In "action": state whether athlete should race, taper, or build more first — with specific advice.
                        In "metrics" include: readinessScore, CTL, TSB, daysToOptimalPeak, tssReductionNeeded%.
                        """)
                .userPromptTemplate("""
                        Assess the race readiness of this cyclist.
                        
                        ATHLETE PROFILE:
                        {{athleteProfile}}

                        TIME CONTEXT:
                        {{timeContext}}
                         
                        PERFORMANCE MANAGEMENT CHART:
                        {{pmcData}}
                        
                        READINESS DATA:
                        {{readiness}}
                        
                        RECENT ACTIVITIES (last 21 days):
                        {{recentActivities}}
                        
                        WEEKLY TRAINING VOLUME:
                        {{weeklyVolume}}
                        
                        FTP HISTORY:
                        {{ftpHistory}}
                        
                        PREVIOUS PREDICTIONS FOR THIS TYPE:
                        {{recentPredictionHistory}}
                        
                        Respond ONLY with valid JSON in this exact format:
                        {{responseFormat}}
                        """)
                .responseFormat(UNIVERSAL_RESPONSE_FORMAT)
                .build();
    }
}
