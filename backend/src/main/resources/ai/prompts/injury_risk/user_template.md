# Injury Risk — User Message Template

Quantify this cyclist's injury risk using the multi-factor ACWR-based model. Calculate acute:chronic workload ratio, training monotony, training strain, and week-over-week TSS increase rate. Classify the risk level (LOW / MODERATE / HIGH / CRITICAL) and prescribe specific load management interventions. If specific injury types are suggested by the load pattern, flag them in warnings.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### PERFORMANCE MANAGEMENT CHART (CTL / ATL / TSB, daily values)
{{pmcData}}

### WEEKLY TRAINING VOLUME (last 8 weeks, weekly TSS totals including currentWeekTss and previousWeekTss)
{{weeklyVolume}}

### READINESS DATA (current score, 14-day trend, HRV, resting HR, sleep)
{{readiness}}

### RECENT ACTIVITIES (last 30 days, with daily TSS for monotony/strain calculation)
{{recentActivities}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. **ACWR calculation (weight 35%)**: Compute acute load (current week TSS or most recent 7 days) and chronic load (4-week rolling average weekly TSS). Calculate ACWR = acute / chronic. Classify against Gabbett's thresholds: <0.8 undertraining, 0.8-1.3 sweet spot, 1.3-1.5 elevated soft tissue risk, 1.5-2.0 high risk, >2.0 critical. Score the risk contribution.
2. **Monotony calculation (weight 25%)**: Compute training monotony from daily TSS data over the assessment window. Monotony = mean(daily TSS) / stddev(daily TSS). Include rest days (TSS=0). Classify against thresholds. Score the risk contribution.
3. **Training strain (weight 20%)**: Multiply the assessment week's TSS by monotony. Classify: <4000 low, 4000-6000 moderate, 6000-8000 high, >8000 very high. Score the risk contribution.
4. **TSS increase rate (weight 15%)**: Calculate week-over-week TSS change percentage using currentWeekTss and previousWeekTss. Check for consecutive weeks exceeding 10% growth. Score the risk contribution. If a >50% single-week spike exists, flag as critical.
5. **Persistent negative TSB (weight 5%)**: Count consecutive days with TSB below −15. If 14+ days, score as contributing risk factor.
6. Compute the total weighted risk score and classify the risk level.
7. For MODERATE risk and above, prescribe specific intervention: TSS reduction percentage, intensity cap, duration of reduced load, reassessment criteria.
8. Flag potential overuse injury types relevant to the athlete's load pattern (patellofemoral, IT band, low back, Achilles, foot).
9. Cite Gabbett's ACWR research explicitly. Reference the training-injury prevention paradox — higher chronic load is protective, but rapid acute load increase is the injury mechanism.
