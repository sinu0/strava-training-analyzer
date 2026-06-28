# Peak Timing — Few-Shot Example

## Scenario

Athlete: 72 kg competitive road cyclist, FTP 290W (4.03 W/kg). Currently 21 days out from an A-priority target event: a 160 km gran fondo with 2500m elevation, estimated duration 5-6 hours. The athlete has been training consistently for 20 weeks with a progressive CTL build from 35 to 62. Current FTP is at an all-time high. The athlete completed a peak training week 7 days ago (680 TSS) and is currently in the final heavy training week before the planned taper. Has a history of arriving at events slightly overcooked (too much training in final 10 days). Sleep average: 7.2 hours (adequate but not exceptional). No injuries. Motivation is high — the athlete is "ready to taper."

## Input Summary (what the model receives)

**PMC Data (current day, 21 days pre-race):**
- CTL: 62 (peak was 63 three days ago, now stabilizing. CTL trajectory over last 12 weeks: 42 → 46 → 49 → 51 → 53 → 55 → 56 → 58 → 59 → 60 → 61 → 62 → 63 → 62. Steady 2-3 point rise per 2 weeks, now plateauing.)
- ATL: 72 (current week is the final heavy week. ATL has been between 65-75 for 4 weeks — consistent high load.)
- ATL/CTL ratio: 72/62 = 1.16
- TSB: −8 (improving this week — was −15 last week after the 680 TSS peak. Recovery is occurring as this week's load is slightly lower than last week.)
- TSB trajectory last 14 days: −18, −16, −15, −14, −15, −12, −10, −11, −10, −9, −8, −8, −7, −8 (slowly rising, recovering from the peak training week)

**CTL Trajectory (detailed):**
The CTL build has been progressive and well-structured:
- Weeks 1-4 (early base): CTL 35→42 (+7)
- Weeks 5-8 (base): CTL 42→52 (+10)
- Weeks 9-12 (build 1): CTL 52→58 (+6)
- Weeks 13-16 (build 2): CTL 58→62 (+4, slower as athlete approaches ceiling)
- Weeks 17-20 (peak/specialize): CTL 62→63→62 (plateauing — this is NORMAL and desirable before a taper)

The plateauing CTL indicates the athlete has reached the current training capacity ceiling — attempting to push CTL higher at this point would require unsustainable training load. The plateau confirms that this is the right time to taper: the athlete has maximized fitness accumulation and now needs to convert fitness into performance through freshness.

**Weekly TSS Data (last 12 weeks):**
- Week 1: 380
- Week 2: 410 (+7.9%)
- Week 3: 440 (+7.3%)
- Week 4: 460 (+4.5%) (recovery week, 70% of peak: 460 planned, was 320)
- Week 5: 480 (+4.3%)
- Week 6: 510 (+6.3%)
- Week 7: 530 (+3.9%) (recovery week: 370)
- Week 8: 540 (+1.9%)
- Week 9: 570 (+5.6%)
- Week 10: 590 (+3.5%) (recovery week: 410)
- Week 11: 640 (+8.5%) — peak loading week approaching taper
- Week 12 (last week, previousWeekTss): 680 (+6.3%) — PEAK WEEK
- Week 13 (current week, currentWeekTss partial, 4 of 7 days): 385 TSS so far, projected ~620 TSS final
- This is the final heavy week. The taper should START after this week completes.

**Peak Week TSS: 680.** This is the reference value from which all taper TSS reductions are calculated.

**FTP History:**
- 20 weeks ago: 250W at 72 kg → 3.47 W/kg
- 12 weeks ago: 265W at 72 kg → 3.68 W/kg
- 6 weeks ago: 280W at 72 kg → 3.89 W/kg
- Current: 290W at 72 kg → 4.03 W/kg
- Total gain: +40W (+16%), +0.56 W/kg over 20 weeks

The FTP trajectory confirms that fitness is at an all-time high and still on an upward trajectory (most recent gain was 10W in 6 weeks = 1.67 W/week — excellent progression).

**Readiness:**
- Current readiness: 58/100
- 14-day trend: 52 → 50 → 48 → 50 → 52 → 54 → 53 → 55 → 56 → 57 → 57 → 58 → 59 → 58 (stable, slight upward trend, recovering from peak week)
- HRV: 83ms (baseline 82ms, +1% — neutral, normally athletes show suppression during heavy weeks, this athlete is handling the load well)
- Resting HR: 50 bpm (baseline 49 bpm, +2% — within normal variation)

**Event Details:**
- Distance: 160 km
- Elevation: 2500m
- Estimated duration: 5-6 hours
- Priority: A-priority (season target)
- Date: 21 days from today

**Athlete History Note:**
Previous events: athlete has a pattern of arriving at events with TSB +2 to +8 — marginally fresh but not fully peaked. In the last target event (3 months ago), the athlete reported "feeling 85%" and faded in the final 45 minutes. This history suggests the taper has been too conservative (insufficient TSS reduction) in previous cycles. A deeper taper (targeting TSB +15 to +20) would likely produce better results.

---

## Expected JSON Response

```json
{
  "summary": "21 days to A-priority 160 km gran fondo. 14-day taper starting in 7 days (Day 14 pre-race). Target: CTL 52, TSB +15 on race day. Taper from peak 680 TSS: Week 1 at 60% (408 TSS), Race week at 35% (238 TSS). Current CTL 62 plateauing — athlete is taper-ready with maximal fitness accumulated. Peak performance window: Days T-8 to T-1. Intensity maintenance: one short race-pace session every 4 days during taper.",
  "insight": "The athlete is in an ideal position to begin a 14-day taper in 7 days. CTL of 62 represents 20 weeks of progressive training with a 77% fitness increase (35→62) — this is exceptional base building and the athlete has earned the right to taper deeply. The plateauing CTL (62→63→62 over the last 2 weeks) is a critical signal: it indicates the athlete has reached the current training capacity ceiling and attempting to push CTL higher would require unsustainable load. The plateau is the body's way of saying 'I've maxed out the current adaptive phase — give me recovery so I can express this fitness.' The 14-day taper duration is appropriate for an A-priority event with CTL 62 (moderate-high fitness base, adequate tissue adaptation time needed). The taper structure reduces TSS from 680 peak to ~408 (60%) in Week 1 and ~238 (35%) in Race week — a progressive 40%→65% reduction that falls within Mujika's 41-60% optimal range while accounting for this athlete's specific history of arriving at events under-tapered (previous TSB +2 to +8). The target TSB of +15 on race day is a deliberate shift upward from the athlete's previous +2 to +8 experiences — the 5-6 hour gran fondo duration demands CTL preservation (hence targeting +15, not +25), but the athlete's history of fading in final 45 minutes suggests insufficient freshness, not insufficient fitness. The CTL decay estimate: starting at 62, 14 days at 47% average TSS (weighted: 60% for 7 days + 35% for 7 days = 47.5% average) should produce CTL decay of approximately 4-6 points, landing at CTL ~56-58 on race day — well above the 50 threshold for a 5-6 hour event. However, the CTL decay calculation using the 42-day time constant: CTL_day_14 = 62 × e^(-14/42) × adjustment_factor. The adjustment factor accounts for the TSS being non-zero during taper — with ~47% of peak TSS, the effective decay is slower than if TSS were zero. Estimated CTL decay: ~4-5 points, producing race day CTL ~57-58, NOT ~52 as initially stated. Let me recalculate: at 47% average TSS relative to the load that built CTL of 62, the CTL equilibrium for this load is approximately 62 × 0.47^0.5 ≈ 42. CTL will decay from 62 toward 42 over the 14 days. After 14 days with 42-day time constant: 62 - (62-42) × (1 - e^(-14/42)) = 62 - 20 × 0.283 = ~56. Race day CTL ~56. At 56 CTL for a 5-6 hour event, the athlete has sufficient aerobic durability. TSB projection: ATL at race day depends on taper TSS. Week 1 ATL equilibrium ≈ 408/7 ≈ 58 TSS/day; Week 2 ATL equilibrium ≈ 238/7 ≈ 34 TSS/day. After 7 days at 58 TSS/day from ATL of ~72: ATL ≈ 72 - (72-58)*(1-e^(-7/7)) = 72 - 14×0.632 = ~63. After next 7 days at 34 TSS/day: ATL ≈ 63 - (63-34)*(1-e^(-7/7)) = 63 - 29×0.632 = ~45. Race day TSB = CTL − ATL = 56 − 45 = +11. If we want TSB +15, we need ATL ~41, requiring slightly lower Week 2 TSS (~200-210). Adjusted prescription: Week 2 at 30-33% of peak (204-224 TSS). This achieves target TSB while maintaining CTL above 55.",
  "action": "Complete current training week at ~620 TSS (final heavy stimulus). Days T-14 to T-8 (Taper Week 1): 408 TSS total. Structure: Monday rest or recovery spin (30 min at 40% FTP). Tuesday — endurance with intensity: 90 min total, 3×8 min at 90-95% FTP (261-276W) with 5 min Zone 2 recovery between. Wednesday — Zone 2 endurance, 75 min at 60-70% FTP (174-203W). Thursday — race pace activation: 60 min, 3×5 min at 95-100% FTP (276-290W). Friday — complete rest. Saturday — Zone 2, 90 min at 60-65% FTP (174-189W). Sunday — endurance with openers: 75 min at 55-65% FTP, 3×30s at 120% FTP (348W) in final 15 minutes. Days T-7 to T-1 (Race Week): 210 TSS total. Monday rest. Tuesday — short activation: 45 min, 3×3 min at race pace (100% FTP/290W). Wednesday — recovery spin, 30 min at 40-45% FTP (116-130W). Thursday — pre-race openers: 60 min, 2×3 min at 100% FTP, 3×30s at 120% FTP, all with full recovery. Friday (day before race): 30 min recovery spin, 2×30s openers at 110% FTP (319W). Race day: 20-min progressive warm-up finishing 10 min before start.",
  "metrics": {
    "daysToEvent": "21",
    "taperStartDate": "Day T-14 (7 days from now)",
    "taperDuration": "14 days",
    "eventPriority": "A",
    "peakWeekTss": "680",
    "taperWeek1Tss": "408 (60% of peak)",
    "taperWeek2Tss": "210 (31% of peak)",
    "totalTaperTssReduction": "55% from peak week",
    "currentCtl": "62",
    "projectedRaceDayCtl": "56",
    "ctlDecayDuringTaper": "-6",
    "currentTsb": "-8",
    "projectedRaceDayTsb": "+15",
    "projectedRaceDayAtl": "41",
    "targetTsbRange": "+5 to +20",
    "peakPerformanceWindow": "Days T-8 to T-1",
    "optimalRaceDayTsb": "+15",
    "ftp": "290W",
    "wkg": "4.03",
    "readinessPreTaper": "58"
  },
  "confidence": 0.85,
  "confidence_breakdown": {
    "data_quality": 0.88,
    "trend_clarity": 0.86,
    "model_certainty": 0.80
  },
  "reasoning": "Step 1 — Peak week identification: The highest TSS week in the last 12 weeks is 680 (last week), with the second-highest at 640 (two weeks ago). These two weeks represent the peak loading period, which is correctly timed 3-4 weeks before the target event. This allows for a 14-day taper following a natural training rhythm. The current week at projected 620 TSS provides one more solid loading stimulus before the taper begins. Step 2 — Taper readiness assessment: The athlete's CTL trajectory shows a desirable pattern — steady rise (35→62 over 20 weeks) followed by plateau (62→63→62 over last 2 weeks). The plateau is NOT a training failure — it is the expected signal that the athlete has reached the adaptive ceiling of the current training block and that further loading would produce diminishing returns. The plateau validates the taper timing. FTP trajectory is strongly upward (+40W, +16% over 20 weeks) with the most recent gain of 10W in 6 weeks showing continued improvement. Readiness of 58 is moderate — not fully recovered from the peak weeks but trending up. This is the correct state for entering a taper: some fatigue present (so the taper has work to do), but not obliterated (so the taper won't need to be overly aggressive). Step 3 — Taper duration selection: 14 days for an A-priority event with CTL 62. Justification: (a) Higher CTL athletes require longer tapers because there is more accumulated fatigue to shed and more fitness to protect. (b) A-priority events warrant the full taper protocol. (c) The athlete's history of arriving at events with marginal freshness (TSB +2 to +8) suggests previous tapers were too short or too conservative. A 14-day taper with a 55% overall TSS reduction addresses this pattern directly. (d) The 160 km/2500m event at 5-6 hours is an endurance-dominant event — CTL preservation matters more than maximum freshness. A 14-day taper (rather than 10-day) gives ATL sufficient time to decline without rushing the TSS reduction. Step 4 — Weekly TSS targets: Peak week = 680 TSS. For a 14-day taper with target TSB +15 on race day, I solve for the TSS values that produce the desired PMC outcomes. Week 1 (early taper, 7 days): 60% of peak = 408 TSS. This represents a 40% immediate reduction from the peak loading weeks. The structure maintains one quality session every 3-4 days as per intensity maintenance guidelines. Week 2 (race week, 7 days): 31% of peak = 210 TSS. This is a further reduction from Week 1 — the athlete's sessions become very short (30-60 min) and predominantly recovery/easy. The 31% figure is lower than the standard 35-45% because: (a) the athlete's history suggests deeper freshness is needed, (b) the readiness of 58 entering taper suggests the athlete is carrying fatigue that needs significant unloading, (c) for a 5-6 hour event, arriving with TSB +15 (not +5) will provide the late-race freshness the athlete has historically lacked. The trade-off: deeper taper costs approximately 1-2 additional CTL points (~56 vs ~58) — for a 160 km event with 5-6 hour duration, CTL 56 is adequate and the freshness gain (+15 vs ~+8) is worth the minor fitness cost. Step 5 — PMC projections: Using the 42-day CTL and 7-day ATL time constants with the prescribed TSS values. CTL decay: starting at 62, the equilibrium CTL for the taper TSS load is lower. At 47% average load (weighted mean of 60% and 31% over 14 days), the equilibrium CTL is approximately 62 × sqrt(0.47) ≈ 42. Over 14 days, CTL decays from 62 toward 42: decay = (62-42) × (1 - exp(-14/42)) = 20 × 0.283 = 5.7. Projected race day CTL: 62 - 5.7 ≈ 56. ATL trajectory: Starting at ~72 (current). Week 1 equilibrium ATL for 58 TSS/day (408/7): ~58. After 7 days: 72 - (72-58) × (1 - exp(-7/7)) = 72 - 14 × 0.632 = 63. Week 2 equilibrium ATL for 30 TSS/day (210/7): ~30. After next 7 days: 63 - (63-30) × 0.632 = 63 - 20.9 = 42. Race day TSB = CTL - ATL = 56 - 42 = +14. Close to target +15 — the slight under-projection can be addressed by reducing Week 2 by an additional 20 TSS or adding one extra recovery day. For practical purposes, +14 vs +15 is equivalent within model precision. Step 6 — Peak performance window: TSB crosses +5 approximately on Day T-9 of the taper (Day 5 of taper Week 1). The window extends from TSB +5 crossing through race day. The athlete enters the peak window ~8 days before the event and remains in it through race day. Race day is positioned in the LATE portion of the peak window — this is intentional for an athlete with a history of arriving at events under-tapered. The athlete will have spent 7-8 days in the positive TSB zone, allowing full fatigue dissipation. CTL has not decayed below 55, preserving endurance capacity. Step 7 — Intensity maintenance: The taper must include short race-pace efforts to prevent detraining and maintain neuromuscular coordination. The prescribed sessions include 3×8 min at 90-95% FTP (Week 1 Tuesday), 3×5 min at 95-100% FTP (Week 1 Thursday), 3×3 min at 100% FTP (Week 2 Tuesday), and 2×3 min at 100% FTP + openers (Week 2 Thursday). These sessions are SHORT (<10 min of total quality work each) and well-spaced (every 3-4 days) — they provide the intensity signal without accumulating significant fatigue. This pattern follows the Mujika intensity maintenance principle: keep intensity, cut volume. Step 8 — Pre-race day protocol (Day T-1): 30-minute recovery spin with 2×30s openers at 110% FTP. The openers provide neuromuscular activation — they trigger the nervous system to 'remember' the firing pattern for race intensity without causing any fatigue. The 30-minute duration is deliberately short to minimize glycogen utilization while still providing the activation signal. The athlete should stay off their feet for the remainder of the day. Step 9 — Mid-taper monitoring: At Day T-11 (3 days into taper), check: (a) Morning readiness — should be rising. If readiness drops below 50, the athlete is not recovering as expected — extend the taper by 1 day and reduce Week 1 TSS by an additional 10%. (b) Subjective feeling — 'tired but recovering' is normal; 'completely drained' suggests the peak weeks were more taxing than recognized — adjust Week 2 TSS downward by 15-20%. (c) If readiness rises above 70 by T-8 (early in peak window), the athlete is recovering faster than anticipated — maintain the plan as-is (the extra freshness is a bonus, not a problem requiring correction). (d) If a minor illness appears, shift immediately to REST_DAY protocol and extend the taper — do not try to 'catch up' on missed sessions.",
  "warnings": [
    "The athlete's history of arriving at events with TSB +2 to +8 (rather than the optimal +10 to +20) is a pattern that this taper is specifically designed to break. The athlete may feel 'under-trained' during Week 2 of the taper (TSS 210 feels like almost nothing after weeks of 600+). This is a psychological challenge, not a physiological one — the athlete must trust that the work is already done and that the last 7 days are about expression, not accumulation.",
    "Do NOT add a 'one last hard session' 5-7 days before the event. This is the most common and most damaging taper error. At T-7 days, any hard session causes ATL to spike and TSB to drop — it takes 5-7 days for TSB to recover from a hard session, meaning the athlete would arrive at the event with suppressed freshness. The last quality session (3×3 min at race pace) at T-4 days is the final stimulus — after this, only activation and recovery.",
    "Weather on race day: for a 5-6 hour event, if forecast predicts temperature >28°C, reduce target power by 5% and increase fluid intake by 200 ml/h. The taper has prepared the athlete's physiology — do not let environmental factors undermine the preparation. The taper prescription assumes standard conditions; extreme heat or cold requires adjustment to race-day execution, not taper structure."
  ],
  "alternatives": [
    {
      "scenario": "Athlete's readiness is above 70 and TSB above +5 by Day T-10 (midway through Week 1 of taper), indicating faster-than-expected recovery",
      "action": "The athlete is recovering exceptionally well — this is good news. Maintain the Week 1 TSS target of 408 (do not add more training to 'use' the freshness — this is the error of mistaking recovery speed for training capacity). Consider shortening the taper to 12 days instead of 14: shift the Week 2 start forward by 2 days. This preserves more CTL (estimated +1-2 points on race day, ~58 instead of ~56) while still achieving TSB +12-14. The race day freshness will be slightly lower but fitness will be slightly higher — for a 5-6 hour event, this trade-off favors endurance durability."
    },
    {
      "scenario": "Life stress (work deadline, family emergency, travel disruption) significantly elevates allostatic load during the taper period",
      "action": "Life stress and training stress are physiologically additive — they compete for the same recovery resources. If significant life stress occurs during the taper, reduce TSS targets by an additional 15-20% AND extend sleep target to 9+ hours. Life stress elevates cortisol, which impairs the parasympathetic recovery response that the taper is designed to promote. The taper must become more aggressive to compensate — arriving at the event with CTL 53 and TSB +18 is better than arriving with CTL 56, TSB +5, and elevated cortisol from unresolved life stress."
    }
  ],
  "references": [
    "Mujika, I. & Padilla, S. (2003) — Scientific bases for precompetition tapering strategies. Medicine & Science in Sports & Exercise, 35(7):1182-1187. Optimal taper: 2-week duration, 41-60% training volume reduction, maintained intensity, performance improvement of 2-3%. Meta-analytic evidence that progressive (non-linear) tapers produce greater performance gains than step tapers.",
    "Friel, J. — The Cyclist's Training Bible. Target TSB +5 to +25 for optimal race condition. Taper structure by event priority: A-priority at 50-60% TSS reduction over 10-14 days. PMC-based peaking: CTL decay during taper, TSB supercompensation window, intensity maintenance principle.",
    "Bosquet, L. et al. (2007) — Effects of tapering on performance: a meta-analysis. Medicine & Science in Sports & Exercise, 39(8):1358-1365. Meta-analysis of 27 studies: 2-week optimal taper duration, 40-60% volume reduction, intensity maintenance critical — removing intensity during taper nullifies the performance benefit."
  ],
  "structured_workout": {
    "type": "taper",
    "total_duration_min": 945,
    "intervals": [
      {
        "duration_sec": 1800,
        "power_target": "40% FTP (116W) or complete rest",
        "cadence": "90-100 rpm if riding",
        "description": "Taper Day 1 (T-14): Recovery spin or complete rest. If riding, 30 min at 40% FTP on flat terrain. Focus: mental transition — training block is over, taper has begun."
      },
      {
        "duration_sec": 5400,
        "power_target": "Endurance with intensity: 3×8 min at 90-95% FTP (261-276W), 5 min Zone 2 recovery between",
        "cadence": "85-95 rpm tempo, 75-85 rpm during quality blocks",
        "description": "Taper Day 2 (T-13): Key intensity maintenance session. 90 min total. Warm-up 20 min Zone 2, main set 3×8 min at 90-95% FTP with 5 min easy spin between, cool-down 15 min Zone 1. This session maintains the threshold engine without accumulating fatigue beyond 24-hour recovery."
      },
      {
        "duration_sec": 4500,
        "power_target": "60-70% FTP (174-203W)",
        "cadence": "85-95 rpm",
        "description": "Taper Day 3 (T-12): Zone 2 endurance. 75 min. Pure endurance — no intensity. Flat to rolling terrain. HR Zone 2 cap. This is the volume component of the taper's 'maintain frequency, reduce intensity' principle."
      },
      {
        "duration_sec": 3600,
        "power_target": "3×5 min at 95-100% FTP (276-290W), full recovery between",
        "cadence": "85-95 rpm, race cadence during quality blocks",
        "description": "Taper Day 4 (T-11): Race pace activation. 60 min total. Warm-up 15 min Zone 2, main set 3×5 min at race pace with 5 min easy spin between, cool-down 10 min Zone 1. Race pace specificity — these efforts should feel smoother than the same effort 2 weeks ago (this is the taper working)."
      },
      {
        "duration_sec": 0,
        "power_target": "Complete rest",
        "cadence": "N/A",
        "description": "Taper Day 5 (T-10): Complete rest day. No cycling. Optional: 20 min foam rolling (quads, hamstrings, glutes) + 10 min static stretching. Sleep 8.5+ hours. This is the first true recovery day of the taper — the body shifts into repair mode."
      },
      {
        "duration_sec": 5400,
        "power_target": "60-65% FTP (174-189W)",
        "cadence": "85-95 rpm",
        "description": "Taper Day 6 (T-9): Zone 2 endurance. 90 min. Flat terrain only. HR Zone 2. The athlete should feel fresher than expected at this effort level — this is the first sign of the taper's effect (TSB is now entering positive territory)."
      },
      {
        "duration_sec": 4500,
        "power_target": "55-65% FTP with 3×30s openers at 120% FTP (348W) in final 15 min",
        "cadence": "85-95 rpm, sprint cadence during openers",
        "description": "Taper Day 7 (T-8): Endurance with openers. 75 min. Zone 2 base riding for 60 min. Final 15 min: 3×30s at 120% FTP with 4.5 min Zone 1 between. These openers provide neuromuscular activation for the race week intensity sessions."
      },
      {
        "duration_sec": 0,
        "power_target": "Complete rest",
        "cadence": "N/A",
        "description": "Taper Day 8 (T-7): Complete rest. Race week begins. Mental preparation: review course profile, nutrition plan, and pacing strategy. Sleep 9 hours. The athlete should feel noticeably fresher — legs should feel 'springy' during daily activities."
      },
      {
        "duration_sec": 2700,
        "power_target": "3×3 min at 100% FTP (290W), full recovery",
        "cadence": "90-100 rpm during quality, 85-95 recovery",
        "description": "Taper Day 9 (T-6): Short activation. 45 min total. 15 min warm-up Zone 2, 3×3 min at 100% FTP with 5 min easy spin between, 5 min cool-down. SHORT session — only 9 min of quality work. This is the last session with any intensity load."
      },
      {
        "duration_sec": 1800,
        "power_target": "40-45% FTP (116-130W)",
        "cadence": "90-105 rpm (light spinning)",
        "description": "Taper Day 10 (T-5): Recovery spin. 30 min. HR Zone 1 only. Spin light. Focus: promote blood flow to legs for repair. The 'nothing session' — it should feel like you did nothing."
      },
      {
        "duration_sec": 3600,
        "power_target": "2×3 min at 100% FTP (290W), 3×30s at 120% FTP (348W), full recovery",
        "cadence": "Race cadence during quality blocks",
        "description": "Taper Day 11 (T-4): Pre-race openers. 60 min total. 20 min Zone 2 warm-up, 2×3 min at 100% FTP with 5 min recovery between, then 3×30s at 120% FTP progressive (last one at 130% if legs feel exceptional). 10 min cool-down. THIS IS THE FINAL QUALITY SESSION. After today, only activation and recovery."
      },
      {
        "duration_sec": 1800,
        "power_target": "40-45% FTP (116-130W), 2×30s openers at 110% FTP (319W)",
        "cadence": "90-100 rpm, race cadence on openers",
        "description": "Taper Day 12 (T-2): Recovery spin with openers. 30 min. Zone 1 riding. At minutes 20 and 25: 30s at 110% FTP (NOT maximal — just race pace activation). These openers are neuromuscular priming, not training. The athlete should feel powerful and eager — if legs feel heavy, reduce openers to 2×15s at 100% FTP."
      },
      {
        "duration_sec": 1200,
        "power_target": "40-45% FTP (116-130W), optional 2×20s at 100% FTP if feeling good",
        "cadence": "90-100 rpm",
        "description": "Taper Day 13 (T-1, day before race): Pre-race spin. 20 min. Zone 1. Include 1-2 SHORT (20s) openers at race pace if the athlete is accustomed to a pre-race activation. Otherwise, pure recovery spin. The purpose is mental — check the bike, feel the legs, calm the nerves. Stay off feet after. Hydrate aggressively. Carb-load: 10g/kg BW (720g carbs) distributed throughout the day. Sleep 8+ hours."
      }
    ]
  }
}
```
