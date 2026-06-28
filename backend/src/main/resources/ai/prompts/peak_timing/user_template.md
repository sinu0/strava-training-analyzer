# Peak Timing — User Message Template

Design a complete tapering and peaking plan for a target cycling event. Calculate: optimal taper start date, taper duration and structure, weekly TSS reduction targets, target CTL/TSB/ATL on race day, peak performance window timing, and daily training prescription during the taper period. Include CTL decay estimates during taper and criteria for adjusting the plan based on mid-taper monitoring.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### TARGET EVENT (date, distance, elevation, estimated duration, priority level)
{{eventDate}}

### PERFORMANCE MANAGEMENT CHART (CTL / ATL / TSB, daily values + trajectory)
{{pmcData}}

### WEEKLY TRAINING VOLUME (last 12 weeks, weekly TSS totals for peak week identification)
{{weeklyVolume}}

### FTP HISTORY (historical FTP values for fitness trajectory analysis)
{{ftpHistory}}

### READINESS DATA (current score, 14-day trend, HRV, resting HR)
{{readiness}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. Identify the athlete's peak weekly TSS over the last 8-12 weeks and record the associated peak CTL. Determine whether the athlete is in a building phase (CTL rising), plateau phase (CTL stable), or declining phase (CTL falling) — this determines taper readiness.
2. Calculate the number of days until the target event. If the event is less than 14 days away, prescribe an abbreviated taper. If the event is more than 28 days away, do not start the taper yet — provide a pre-taper period plan and the date when the taper should commence.
3. Determine taper duration based on event priority, CTL level, and readiness:
   - A-priority: 10-14 days (use 14 if CTL ≥ 55 and readiness < 65; use 10 if CTL < 50 or readiness > 70)
   - B-priority: 7-10 days
   - C-priority: 3-5 days
4. Calculate the target TSS for each week of the taper as a percentage of peak week TSS. Prescribe the progressive reduction: 65-75% in early taper, 50-60% in mid taper, 30-40% in race week.
5. Estimate CTL decay through the taper using the 42-day time constant approximation. Calculate projected CTL on race day. Ensure projected CTL is adequate for the event duration.
6. Calculate projected TSB on race day based on ATL decay (7-day time constant) and CTL decay. Target TSB +5 to +25. If projected TSB is below +5, the taper is insufficient — increase TSS reduction. If projected TSB is above +25, the taper is too aggressive — reduce TSS reduction to preserve more fitness.
7. Identify the peak performance window: the date range when TSB first crosses +5 (lower bound) and when CTL would drop below the event-adequate threshold (upper bound). Position race day appropriately within this window.
8. Prescribe daily training structure during the taper: key sessions to include (intensity maintenance), sessions to remove or shorten, recovery day placement, pre-race day protocol.
9. Provide mid-taper monitoring criteria: what to check at Day 5-7 of taper (TSB, readiness, HRV, subjective feeling) and how to adjust the remaining taper based on these checks.
