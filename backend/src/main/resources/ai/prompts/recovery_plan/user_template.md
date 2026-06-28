# Recovery Plan — User Message Template

Assess this cyclist's current recovery status and prescribe an appropriate recovery protocol. Classify the recovery level (FULL_ACTIVE / ACTIVE_RECOVERY / PASSIVE_RECOVERY / REST_DAY). Provide a complete regeneration plan including: recovery duration, daily activity protocol, body work (foam rolling + stretching), sleep targets, nutrition focus, and criteria for when to resume structured training.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### READINESS DATA (current score, 14-day trend, HRV, resting HR, sleep metrics)
{{readiness}}

### PERFORMANCE MANAGEMENT CHART (CTL / ATL / TSB, daily values for assessment)
{{pmcData}}

### RECENT ACTIVITIES (last 14 days, session types and intensities)
{{recentActivities}}

### WEEKLY TRAINING VOLUME (last 4 weeks, current week partial)
{{weeklyVolume}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. Perform the Five-Point Recovery Check: (1) TSB depth and trajectory — is TSB negative? For how many days? Is it improving or worsening? (2) Readiness score and trend — what is the current score and the 14-day trajectory? Are HRV and RHR convergent? (3) Recent training density — how many hard days in the last 7 days? What is the pattern? (4) Sleep quality and quantity — is there a cumulative sleep deficit? (5) Subjective markers — are there any reports of heavy legs, flat feelings, or motivation loss?
2. Classify the recovery level (FULL_ACTIVE / ACTIVE_RECOVERY / PASSIVE_RECOVERY / REST_DAY) based on the most limiting factor. If factors diverge (e.g., TSB is moderate but readiness very low), explain the discrepancy and choose the more conservative prescription.
3. Prescribe a complete recovery protocol for the next 1-3 days: which recovery level, specific activities (cycling parameters if active recovery, off-bike activities if passive), body work (foam rolling target areas + static stretch sequence), sleep target and quality optimizations, nutrition emphasis (anti-inflammatory foods, hydration targets, any supplements).
4. Define the Return-to-Training criteria: what specific metrics must the athlete achieve before resuming structured training (TSB threshold, readiness threshold, resting HR/HRV normalization, subjective markers).
5. If the athlete is NOT in a recovery-needing state (TSB positive, readiness high, good sleep), provide a maintenance recommendation rather than forced recovery. A well-recovered athlete should train, not rest.
