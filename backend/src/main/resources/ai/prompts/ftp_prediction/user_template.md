# FTP Prediction — User Message Template

Analyze this cyclist's training data and predict their Functional Threshold Power (FTP) trajectory over the next 4–8 weeks. Base your estimate on PMC trends, power curve best efforts, and recent training load. Project a specific FTP value (in watts) with clear rationale.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### FTP HISTORY (last 12 months, actual tested or estimated values)
{{ftpHistory}}

### RECENT ACTIVITIES (last 30 days, with power data)
{{recentActivities}}

### PERFORMANCE MANAGEMENT CHART (CTL / ATL / TSB daily values)
{{pmcData}}

### POWER CURVE (best efforts at 1-min, 5-min, 20-min, 60-min durations)
{{powerCurve}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. Extract the current estimated FTP from the input. Identify the most recent maximal 20-minute effort and compute the Coggan-derived FTP (20-min power × 0.95). Compare with the athlete's recorded FTP.
2. Analyze CTL trend over the last 4–8 weeks. Is CTL rising, flat, or declining? At what rate (points per week)?
3. Check TSB trajectory. Is the athlete recovering toward neutrality (TSB approaching 0 from negative) or sinking deeper into fatigue?
4. Examine recent power curve data. Compare 20-minute, 5-minute, and 1-minute bests from the last 14 days against values from 4–8 weeks ago. Note any gains or losses in watts.
5. Assess weekly TSS trends using currentWeekTss and previousWeekTss. If sustained >450/week, flag potential FTP underestimation.
6. Project a specific FTP value and a confidence score, with a breakdown of contributing factors.
7. If knowledgeBase RAG context is provided, incorporate relevant scientific citations.
