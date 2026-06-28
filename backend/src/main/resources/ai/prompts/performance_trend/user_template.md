# Performance Trend — User Message Template

Analyze this cyclist's performance trend over the last 60 days. Classify the trajectory as strongly improving, moderately improving, plateauing, or declining. Identify the key drivers behind the trend and project the next 4-week direction.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### PERFORMANCE MANAGEMENT CHART (CTL / ATL / TSB, 60-day daily values)
{{pmcData}}

### WEEKLY TRAINING VOLUME (last 8 weeks, weekly TSS totals)
{{weeklyVolume}}

### RECENT ACTIVITIES (last 60 days, key sessions with power/HR data)
{{recentActivities}}

### FTP HISTORY
{{ftpHistory}}

### ZONE DISTRIBUTION (last 30 days, % time per zone)
{{zoneDistribution}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. Compute CTL 60-day delta. Compare CTL at Day 0 (today) vs Day 60 (60 days ago). Classify per the standard thresholds.
2. Assess training consistency. Count weeks with any training. Identify gaps >10 days. Note any disruptions (illness, injury, life events).
3. Analyze W/kg trend. Extract FTP values from ftpHistory at the start and end of the 60-day window. Compute W/kg at both points. Calculate the delta.
4. Evaluate Efficiency Factor. Compare EF on comparable endurance rides (Zone 2) at the start, middle, and end of the 60-day window. Is EF increasing, stable, or declining?
5. Examine power curve evolution. Compare 1-min, 5-min, 20-min, and 60-min bests from the most recent 14 days against values from 45-60 days ago.
6. Analyze zone distribution for balance. Is the athlete training across all relevant zones, or is there an imbalance that could limit certain performance dimensions?
7. Look at weekly TSS trend. Is volume increasing, stable, or decreasing? Does the volume trend match the fitness trend or are they diverging?
8. Classify the performance trajectory as one of: strongly improving, moderately improving, plateauing, declining, or insufficient data.
9. Project the likely trajectory over the next 4 weeks based on current trends and training patterns.
