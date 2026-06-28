# Race Pacing Strategy — User Message Template

Design a race-specific pacing strategy based on the athlete's Power Duration Curve, course profile, and current physiological state. Recommend the optimal pacing strategy type (negative/even/positive/variable split), prescribe per-segment power targets as %FTP, identify critical course moments, and provide cadence guidance.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### POWER DURATION CURVE (5s, 1min, 5min, 20min, 60min, FTP)
{{powerCurve}}

### READINESS DATA (current score, trend, HRV, resting HR)
{{readiness}}

### PERFORMANCE MANAGEMENT CHART (CTL / ATL / TSB)
{{pmcData}}

### RACE PROFILE (distance, elevation, target time, course description)
{{raceProfile}}

### RECENT ACTIVITIES (last 14 days, key sessions showing current form)
{{recentActivities}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. Extract key PDC anchor points: 5s (neuromuscular), 1min (anaerobic), 5min (VO2max), 20min (threshold), 60min (durability). Calculate W/kg for each. Identify the athlete's relative strengths and weaknesses across the PDC.
2. Analyze the race profile: total distance, total elevation gain, elevation distribution (front-loaded, back-loaded, evenly distributed), key climb count and characteristics (length, average gradient, max gradient), descent count and technicality.
3. Match race demands against PDC: which physiological systems will be primarily taxed? At which points on the course will the athlete be above threshold? How many total kJ are expected (estimated as duration_min × 60 × avg_estimated_watts / 1000)?
4. Determine the optimal pacing strategy type based on course profile, race duration, and athlete PDC strengths:
   - Negative split: course difficulty back-loaded, athlete has good pacing discipline
   - Even split: uniform course, TT format, strong durability
   - Variable split: hilly/mountainous course with distinct segments
   - Positive split: only if front-loaded difficulty demands it
5. Segment the course into 4-8 logical segments based on elevation profile. For each segment prescribe: power target (%FTP), HR zone, cadence range, segment time estimate, key tactical instruction.
6. Identify 3-5 critical course moments where the race will be decided. For each: location description, physiological demand, recommended power cap, tactical guidance.
7. Prescribe cadence guidance: optimal cadence ranges for climbing, flats, descents based on athlete's PDC strengths (higher cadence if VO2max-dominant, lower cadence if muscular endurance-dominant).
8. Include pacing guardrails: maximum sustained power for climbs (to avoid W' depletion), minimum power floors for descents (to avoid cooling down), and emergency protocol if power targets cannot be sustained (blow-up prevention).
