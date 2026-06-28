# Race Readiness — User Message Template

Assess this cyclist's readiness for an upcoming race or high-intensity event. Classify the readiness level (Not Ready / Marginally Ready / Good Readiness / Peak Readiness). If a taper is needed to optimize performance, prescribe the specific taper protocol with TSS reduction targets and intensity maintenance guidelines.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### PERFORMANCE MANAGEMENT CHART (CTL / ATL / TSB)
{{pmcData}}

### READINESS DATA (current score, trend, HRV, resting HR)
{{readiness}}

### RECENT ACTIVITIES (last 21 days, key sessions)
{{recentActivities}}

### WEEKLY TRAINING VOLUME (recent weeks, current week partial)
{{weeklyVolume}}

### FTP HISTORY
{{ftpHistory}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. Extract CTL, ATL, and TSB from PMC data. Classify the athlete's fitness state per Friel's optimal race condition thresholds (CTL > 50, TSB +5 to +25, ATL declining).
2. Evaluate readiness score against the four readiness categories. Cross-reference readiness with PMC data — do they converge on the same conclusion?
3. Identify the primary limiter for race readiness: fitness (CTL too low), fatigue (TSB too negative / ATL too high), or both.
4. If the event requires a taper, compute the target TSS reduction based on event priority:
   - Determine the athlete's peak weekly TSS over the last 4 weeks.
   - Apply the appropriate reduction percentage based on priority level.
   - Prescribe the taper structure: volume reduction, intensity maintenance, key sessions to include.
5. If the event is within 7 days, provide event-day recommendations: pacing strategy based on current FTP and CTL, nutrition plan, and warm-up protocol.
6. If the athlete is not ready, recommend whether to skip the event, treat it as training, or pursue an aggressive short taper (if fatigue is the only limiter).
7. Estimate the number of days to optimal peak condition at the current CTL level, assuming a standard 50% TSS taper.
