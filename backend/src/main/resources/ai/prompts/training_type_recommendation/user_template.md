# Training Type Recommendation — User Message Template

Recommend the optimal training session for today. The recommendation must be specific: session type, duration in minutes, target power range (in watts and/or %FTP), and target heart rate zone. Consider all available data layers to make a coherent, week-integrated decision.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### READINESS DATA (current score, trend, dayType, dayLabel, dayFocus, sessionVariants, fuelingHint, recoveryHint, tomorrowHint, 72h quality windows)
{{readiness}}

### PERFORMANCE MANAGEMENT CHART (CTL / ATL / TSB)
{{pmcData}}

### ZONE DISTRIBUTION (last 30 days, time in each power zone)
{{zoneDistribution}}

### WEEKLY TRAINING VOLUME (current week partial TSS, previous week TSS, weekly TSS trend)
{{weeklyVolume}}

### DURABILITY (aerobic decoupling Pa:HR drift, power fade trends)
{{durability}}

### BLOCK HEALTH (current block stability, over-adjustment flags, missing stimulus flags)
{{blockHealth}}

### COACH MEMORY (athlete preference patterns — accepted or rejected previous corrections)
{{coachMemory}}

### PROGRAM REVIEW (weekly objective, recent execution quality, planned sessions for next 3-7 days)
{{programReview}}

### RECENT ACTIVITIES (last 7 days, detailed session data)
{{recentActivities}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. Start with the readiness payload. Extract dayType, dayLabel, and dayFocus. These are the system's pre-computed recommendation. Use them as your starting baseline.
2. Verify against PMC state: Does TSB support the recommended intensity level? If readiness says "hard intervals" but TSB is −25, this is a conflict — flag it and recommend the TSB-appropriate alternative.
3. Check guard rails: Is TSB below −30, readiness below 25, or ATL/CTL above 1.35? If any red flag is present, recommend rest or recovery. If none are present but TSB is negative, resist the urge to prescribe rest — the athlete is in productive fatigue and should train at an appropriate intensity.
4. Apply block context: Does blockHealth need protection? Is there a missing stimulus type that today's session should address? Does programReview indicate a key session planned?
5. Check zone distribution for underrepresented zones. If a zone is at <8% of total time, prioritize it — but only if TSB and readiness permit the intensity.
6. Integrate durability data: If decoupling is high, protect the session structure (cap intensity, recommend flat terrain if outdoors).
7. Apply coach memory: If the athlete rejects certain session types, offer alternatives. If they consistently skip rest days, offer minimum effective dose.
8. Produce a specific structured workout: type, total duration in minutes, interval structure with power targets (watts and %FTP), cadence ranges, and HR zones.
