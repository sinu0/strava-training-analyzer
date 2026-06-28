# Race Readiness — Few-Shot Example

## Scenario

Athlete: 68 kg competitive club cyclist, FTP 280W (4.12 W/kg). Target event: A-priority road race (120 km, hilly) in 7 days. Has been training consistently for 16 weeks with a progressive build. Currently in the final week before a planned taper start date.

## Input Summary (what the model receives)

**PMC Data:**
- CTL: 58 (has risen from 42 to 58 over 16 weeks, currently stable)
- CTL 4-week trend: 55 → 56 → 57 → 58 (slow, steady rise)
- ATL: 55 (declining from peak of 70 two weeks ago)
- ATL 4-week trend: 70 → 65 → 59 → 55 (steady decline during taper)
- TSB: +12 (rising from −8 twelve days ago, crossing into positive 5 days ago, currently +12)
- TSB trajectory: −8 → −3 → +1 → +5 → +8 → +12 (steady improvement daily)

**Readiness:**
- Current readiness: 78/100
- 7-day trend: 62 → 67 → 71 → 74 → 76 → 78 (rising)
- HRV: 88ms (baseline 82ms, +7% above baseline — positive)
- Resting HR: 48 bpm (baseline 50 bpm, −4% below baseline — positive)
- Sleep: 7.8 hrs average (target 7.5 hrs, good quality)

**Weekly Training Volume:**
- Peak week (3 weeks ago): 580 TSS
- Week -2: 420 TSS (28% reduction from peak — taper initiated)
- Week -1 (previousWeekTss): 310 TSS (47% reduction from peak)
- Current week partial (4 days through taper, currentWeekTss): 180 TSS
- Projected full current week: ~260 TSS (55% reduction from peak — on target for A-priority taper)

**FTP History:**
- 16 weeks ago: 255W at 68 kg → 3.75 W/kg
- 8 weeks ago: 270W at 68 kg → 3.97 W/kg
- Current: 280W at 68 kg → 4.12 W/kg
- Total gain: +25W (+9.8%), +0.37 W/kg over 16 weeks

**Recent Activities (taper period, key sessions):**
- 5 days ago: Short intensity maintenance — 90 min total, 3×8 min at 95-100% FTP (265-280W), felt strong, HR response normal
- 3 days ago: Zone 2 endurance with openers — 75 min at 60-70% FTP (168-196W), 3×30s sprint openers at 400W+, legs felt snappy
- Yesterday: Recovery spin — 45 min at 45-50% FTP (126-140W), HR Zone 1 throughout

**Event Details (from context):**
- Distance: 120 km, estimated duration: 3.5-4 hours
- Terrain: hilly, 1800m total elevation
- Priority: A-priority (target event of the season)
- Date: 7 days from today

---

## Expected JSON Response

```json
{
  "summary": "Peak readiness (78/100). CTL 58, TSB +12 and rising, ATL declining 70→55 over 2-week taper, readiness climbing with positive HRV. All indicators converge on optimal race condition. Continue taper at 55% TSS reduction. Athlete is on track for peak performance on race day.",
  "insight": "The athlete is in an ideal pre-race state with convergent positive signals across all major readiness dimensions. CTL of 58 provides a sufficient fitness base for a 120 km hilly road race — this represents 16 weeks of progressive build from 42, a 38% fitness increase. TSB of +12 is squarely in Friel's optimal freshness window (+5 to +25) and has been rising steadily over 12 days as the taper takes effect. The rising TSB combined with stable CTL (not declining) is the hallmark of a well-executed taper: the athlete is shedding fatigue while retaining fitness. ATL has declined from a peak of 70 to 55 over 14 days — a 21% reduction that is appropriate for an A-priority taper, and the fact that CTL has only declined from 59 to 58 in the same period validates the taper's volume/intensity balance. Readiness of 78 with rising HRV (+7% above baseline) and lowered resting HR (−4%) is autonomic confirmation that the parasympathetic nervous system is dominant — the athlete is recovered and primed. The FTP gain of 25W (9.8%) over the training cycle is exceptional and provides strong foundation for race performance. Yesterday's recovery spin with 'snappy' legs during openers suggests neuromuscular readiness is high. The 7-day window to race day provides sufficient time to complete the final taper phase without fitness decay.",
  "action": "Maintain current taper trajectory. For the final 7 days: Days 1-3 — Zone 2 endurance rides (60-90 min, 55-65% FTP/154-182W) with one short intensity block on Day 2 (3×5 min at race pace, 90-95% FTP/252-266W). Day 4 — complete rest or 30-min recovery spin. Day 5 — 60-min easy with 3×2 min at race intensity (100% FTP/280W) and 2×30s openers at 450W+. Day 6 (day before race) — 45-min recovery spin with 3×30s openers at 400W, stay off feet after. Race morning — 20-min progressive warm-up including 2×2 min at race pace, finish 10 min before start.",
  "metrics": {
    "readinessScore": "78",
    "readinessCategory": "Good Readiness",
    "ctl": "58",
    "tsb": "+12",
    "atlTrend": "declining 70→55",
    "daysToOptimalPeak": "3-5 days",
    "tssReductionFromPeak": "55%",
    "peakWeekTss": "580",
    "currentProjectedWeekTss": "260",
    "ftp": "280W",
    "wkg": "4.12"
  },
  "confidence": 0.88,
  "confidence_breakdown": {
    "data_quality": 0.91,
    "trend_clarity": 0.93,
    "model_certainty": 0.80
  },
  "reasoning": "Step 1 — PMC evaluation: CTL 58 exceeds the 50 minimum threshold for race readiness by a comfortable margin. For a 120 km hilly road race (estimated 3.5-4 hours), a CTL >50 indicates the athlete has sufficient aerobic durability to complete the event at race intensity without catastrophic fatigue. TSB of +12 is within the optimal +5 to +25 window and has been rising steadily (+20 points over 12 days = +1.7/day), indicating effective supercompensation. ATL trajectory (70→65→59→55) over 2 weeks confirms that the taper is working — fatigue is dissipating while CTL is holding. The ATL/CTL ratio of 55/58 = 0.95 is neutral (slightly below 1.0, which is ideal pre-race as it means freshness slightly exceeds fitness accumulation). Step 2 — Readiness validation: Readiness of 78 with positive HRV deviation (+7% above baseline) and lowered resting HR (−4%) provides strong autonomic confirmation of preparedness. All readiness metrics are convergent — no contradictions. Step 3 — Limiter identification: No limiter identified. Fitness is adequate (CTL 58), freshness is optimal (TSB +12), and readiness is high (78). The taper is proceeding exactly as planned. Step 4 — Taper prescription: Current taper trajectory (55% TSS reduction from 580 peak to projected 260) is correct for an A-priority event (target 50-60% reduction over 10-14 days per Friel's protocol). The taper began approximately 14 days ago with the drop from 580 to 420 TSS. The remaining 7 days should continue at similar load — no need to reduce further as TSB is already in the optimal range and too-aggressive reduction would risk CTL decay. Step 5 — Event-day calculation: At current CTL of 58 with TSB +12, the athlete has approximately 3-5 days to their theoretical peak TSB (at current ATL decline rate and CTL stability, TSB should peak around +15-18 in 3-5 days). The race in 7 days is slightly past theoretical peak, but the difference between TSB +15 and TSB +10 is negligible for performance. TSB will still be well within the optimal window. Step 6 — FTP context: 280W (4.12 W/kg) is a strong competitive amateur level. For the 120 km race, race pace is likely 75-85% of FTP (210-238W) for sustained sections with surges above 300W on climbs. The athlete's durability (no decoupling issues noted) suggests they can hold this effort for the expected duration. Step 7 — Confidence assessment: High overall confidence. PMC data is complete and current (no gaps). FTP was tested recently. Readiness measurements are dense (daily readings). Taper load data is complete. The only minor uncertainty is the lack of recent long-ride data (the taper has prioritized rest over endurance maintenance), but this is correct protocol — the fitness was built in the preceding 14 weeks and does not decay meaningfully in a 2-week taper.",
  "warnings": [
    "TSB exceeding +20 in the final 3 days before the race may indicate the taper is slightly too aggressive. If TSB crosses +20, add a short (45-min) Zone 2 ride with 5-min at race pace to prevent the 'stale' feeling some athletes report with excessive freshness.",
    "Race day pacing: with 4.12 W/kg FTP and hilly terrain, resist the urge to follow attacks above 120% FTP (336W+) in the first hour — these efforts on a fresh but not race-hardened body can cause premature fatigue that compromises the final 30 km."
  ],
  "alternatives": [
    {
      "scenario": "Athlete reports feeling 'too fresh' or 'stale' 3 days before the race (common taper side effect)",
      "action": "Add a short, sharp activation session: 60 min total, 20 min warm-up, 3×3 min at 100-105% FTP (280-294W) with 5 min Zone 2 recovery between, 10 min cool-down. This provides neuromuscular activation without accumulating fatigue. The 'stale' feeling typically resolves after the first 10 minutes of racing regardless, but the activation session provides psychological confidence."
    },
    {
      "scenario": "Weather forecast shows extreme heat on race day (>30°C / 86°F)",
      "action": "Adjust race day strategy: reduce target power by 5-8% to account for thermal stress. Target 195-225W sustained (70-80% FTP) rather than 210-238W. Increase fluid intake plan from 750ml/hr to 1000ml/hr with electrolyte supplementation. Pre-cool with ice vest or cold towels in the 30 min before start. This adjustment prioritizes finishing strong over raw power targets in conditions where thermal stress is the primary performance limiter."
    }
  ],
  "references": [
    "Friel, J. — The Cyclist's Training Bible: Optimal race condition thresholds (CTL > 50, TSB +5 to +25, ATL declining). Taper protocols by event priority (A-priority: 50-60% TSS reduction over 10-14 days).",
    "Mujika, I. & Padilla, S. (2003) — Scientific bases for precompetition tapering strategies. Medicine & Science in Sports & Exercise. Volume reduction of 41-60% with maintained intensity yields performance improvements of 2-3% in trained cyclists.",
    "Bosquet, L. et al. (2007) — Effects of tapering on performance: a meta-analysis. Medicine & Science in Sports & Exercise. Meta-analysis of 27 studies confirming optimal taper: 2-week duration, 40-60% training volume reduction, maintained intensity and frequency."
  ]
}
```
