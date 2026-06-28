# Overtraining Risk — User Message Template

Quantify this cyclist's overtraining risk using the weighted multi-factor model. Classify the risk level (LOW / MODERATE / HIGH / CRITICAL) and provide a specific intervention recommendation appropriate to the risk level.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### PERFORMANCE MANAGEMENT CHART (CTL / ATL / TSB, daily values for assessment period)
{{pmcData}}

### WEEKLY TRAINING VOLUME (last 8 weeks, weekly TSS totals and weekly growth rates)
{{weeklyVolume}}

### READINESS DATA (current score, 14-day trend, HRV, resting HR, sleep metrics)
{{readiness}}

### RECENT ACTIVITIES (last 30 days, with TSS per session for monotony calculation)
{{recentActivities}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. **TSB assessment (weight 30%)**: Count consecutive days with TSB below −25. Count consecutive days with TSB below −30. Is the TSB trend improving (rising), worsening (falling), or stable? Score the risk contribution.
2. **Monotony computation (weight 20%)**: Calculate training monotony using daily TSS data from recentActivities over the assessment window. Monotony = mean(daily TSS) ÷ stddev(daily TSS). If rest days exist (TSS=0), include them — they meaningfully lower monotony. Score the risk contribution.
3. **TSS growth rate (weight 20%)**: Compare weekly TSS week-over-week for the assessment window using currentWeekTss/previousWeekTss data. Count consecutive weeks where growth exceeds 10%. Compute the average growth rate over that stretch. Score the risk contribution.
4. **Readiness trend (weight 15%)**: Assess readiness score trajectory over the last 14 days. Is it rising, stable, or declining? At what rate? Is the absolute score below the 40 threshold? Score the risk contribution.
5. **ATL/CTL ratio (weight 15%)**: Compute the current ATL/CTL ratio. Is it above the 1.3 caution threshold? Above the 1.5 red flag threshold? Has it been sustained or is it transient? Score the risk contribution.
6. Compute the weighted total risk score (0-100) and classify the risk level.
7. If risk is MODERATE or above, prescribe a specific intervention: rest days count, TSS reduction percentage, intensity cap, reassessment timeline.
8. If risk is HIGH or CRITICAL, the action must include mandatory rest/recovery — do not compromise for training optimization.
