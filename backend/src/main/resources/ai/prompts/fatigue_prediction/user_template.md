# Fatigue Assessment — User Message Template

Assess the current fatigue level of this cyclist. Determine whether the athlete is in a productive training zone, approaching cumulative fatigue, or requiring immediate recovery intervention. Project a recovery timeline in days if fatigue is elevated.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### READINESS DATA (current score, trend, HRV, resting HR, sleep metrics)
{{readiness}}

### WEEKLY TRAINING LOAD (last 8 weeks, weekly TSS totals and trend)
{{weeklyVolume}}

### PERFORMANCE MANAGEMENT CHART (CTL / ATL / TSB daily values)
{{pmcData}}

### RECENT ACTIVITIES (last 14 days, with TSS, IF, and duration per session)
{{recentActivities}}

### SUBJECTIVE FEEL (journal mood trend over last 14 days)
{{journalMoodTrend}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. Extract ATL, CTL, and TSB values from PMC data. Compute the current ATL/CTL ratio. Identify the TSB zone per Friel's classification (deep fatigue / productive fatigue / normal / fresh / detraining).
2. Analyze TSB trajectory over the last 14 days. Is TSB rising (recovering), falling (accumulating fatigue), or stable? At what rate (points per day)?
3. Check weekly TSS using currentWeekTss and previousWeekTss. Flag if >550 for 2+ consecutive weeks. Look for week-over-week TSS growth >15%.
4. Evaluate readiness score. Is it above or below the 25 and 55 thresholds? Is the 7-day trend rising or declining? Cross-reference readiness with TSB — do they agree?
5. Identify the hardest recent sessions (within 48 hours). Are they inflating ATL temporarily, or is the load sustained?
6. Classify the fatigue level (mild / moderate / significant / accumulated deep) and estimate days to full recovery.
7. If readiness data contradicts PMC data (e.g., readiness is high but TSB is very negative), note the discrepancy and weight readiness more heavily (subjective feel is often a leading indicator).
