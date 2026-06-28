# Training Type Recommendation — Few-Shot Example

## Scenario

Athlete: 68 kg road cyclist, FTP 275W (4.04 W/kg). Currently in Week 3 of a 4-week threshold build block. Has been consistent with training. Zone distribution shows strong Zone 2 volume but underrepresented Zone 4 work. The weekly program objective targets threshold development. No red flags in readiness or PMC.

## Input Summary (what the model receives)

**PMC Data:**
- CTL: 58 (rising, +2/week over 4 weeks)
- ATL: 62 (stable)
- ATL/CTL ratio: 1.07
- TSB: −12 (productive fatigue zone, has been stable between −10 and −14 for 7 days)

**Readiness:**
- Score: 45/100 (controlled training zone)
- dayType: "train"
- dayLabel: "quality_day"
- dayFocus: "threshold_development"
- sessionVariants: ["2x20_min_ftp", "3x15_min_sweetspot", "over_unders"]
- fuelingHint: "60-90g carbs/hour during quality work"
- recoveryHint: "good recovery window tomorrow — can push today"
- tomorrowHint: "endurance day"
- 72h quality window: "today and tomorrow morning are best quality windows"

**Zone Distribution (last 30 days, % of total time):**
- Zone 1 (Active Recovery, <55% FTP): 12%
- Zone 2 (Endurance, 56-75% FTP): 48%
- Zone 3 (Tempo, 76-90% FTP): 22%
- Zone 4 (Threshold, 91-105% FTP): 5% ← underrepresented
- Zone 5 (VO2max, 106-120% FTP): 8%
- Zone 6 (Anaerobic, 121-150% FTP): 4%
- Zone 7 (Neuromuscular, >150% FTP): 1%

**Weekly Volume:**
- currentWeekTss: 280 (through 3 days, target ~500 by end of week)
- previousWeekTss: 480
- Weekly objective: threshold build

**Durability:**
- Aerobic decoupling (Pa:HR at 2 hrs): 3.2% (good, below 5% threshold)
- Power fade (3+ hour rides): not assessed (no recent rides >2.5 hrs)

**Block Health:**
- Status: "stable"
- Missing stimulus: "none" (block is on track)

**Program Review:**
- Week 3 objective: "Peak threshold week — target 2 quality sessions with 40+ minutes total time at 95-105% FTP"
- Execution so far: "1 threshold session completed (2×20min at 270-280W on Monday). Athlete rated session 8/10 difficulty."
- Next 3 days planned: "Today: threshold or sweet spot. Tomorrow: Zone 2 endurance 2.5 hrs. Day after: Zone 2 + sprints."

**Coach Memory:**
- Athlete accepts: intensity work, structured intervals, endurance rides
- Athlete tends to reject: full rest days (will do at least 60 min Zone 2), early morning starts before 7am

---

## Expected JSON Response

```json
{
  "summary": "Threshold intervals — 2×20 minutes at 260-290W (95-105% FTP), 90 minutes total. Zone 4 is underrepresented at 5% and this is a peak threshold week in a stable build block with TSB −12 in the productive fatigue window.",
  "insight": "The readiness payload confirms today as a quality day with threshold_development focus — this aligns perfectly with the athlete's current state. TSB at −12 is in the productive fatigue zone (−30 to −10), meaning the athlete can absorb and benefit from threshold work without being fresh enough for VO2max. Zone distribution reveals Zone 4 at only 5% of total volume over 30 days, well below the recommended 10-15% during a threshold build block. The athlete has both the capacity and the need for this exact stimulus. Durability metrics are strong (3.2% decoupling), so the session can be prescribed without terrain or fueling restrictions beyond the standard fueling hint. Tomorrow's endurance day provides a recovery window before the next quality session, and block health is stable with no missing stimulus flags — the block is progressing exactly as planned.",
  "action": "Structured threshold session. Total duration 90 minutes: 15-min progressive warm-up (50-85% FTP), 2×20 minutes at 260-290W (95-105% FTP) with 10-min Zone 2 recovery between intervals, 15-min cool-down. Cadence 85-95 rpm during intervals. HR should reach but not exceed Zone 4 (88-93% of LTHR) by the end of each 20-minute block. If power falls below 250W on the second interval, terminate the interval and extend the cool-down — this would indicate the first block was sufficient stimulus given current fatigue state.",
  "metrics": {
    "tsb": "-12",
    "readinessScore": "45",
    "recommendedType": "threshold_intervals",
    "targetPowerRange": "260-290W",
    "targetPowerPctFtp": "95-105%",
    "expectedTss": "95",
    "underrepresentedZone": "Zone 4",
    "zone4percent": "5%",
    "blockHealth": "stable",
    "decouplingPct": "3.2%"
  },
  "confidence": 0.88,
  "confidence_breakdown": {
    "data_quality": 0.92,
    "trend_clarity": 0.90,
    "model_certainty": 0.82
  },
  "reasoning": "Step 1 — Readiness load: dayType='train', dayLabel='quality_day', dayFocus='threshold_development'. The system's pre-computed assessment is clear and well-supported. Session variants include 2×20 FTP, 3×15 sweet spot, and over-unders. The 2×20 format is the best match for a peak threshold week. Step 2 — PMC verification: TSB at −12 is in the productive fatigue zone. ATL/CTL ratio 1.07 is within the 0.8-1.2 optimal range. No guard-rail red flags (TSB > −30, readiness > 25, ATL/CTL < 1.35). The athlete can safely absorb threshold intensity. Step 3 — Zone gap analysis: Zone 4 at 5% versus a recommended 10-15% during threshold build is the clearest training gap. Zone 2 is well-served at 48%, and Zone 3 is adequate at 22%. Zone 5 at 8% is acceptable. The primary training need is unequivocally threshold work. Step 4 — Block and program context: This is Week 3 of a 4-week threshold build. The program objective calls for peak threshold week with 2 quality sessions. Already 1 session completed on Monday (rating 8/10 — challenging but completable). Today's session should be the second and final threshold session of the week. Tomorrow's planned endurance ride allows recovery before any additional load. Block health is 'stable' — no protective override needed. Step 5 — Durability: Decoupling at 3.2% is excellent. No terrain or fueling restrictions beyond the standard fueling hint (60-90g CHO/hr). The athlete can execute this session indoors or outdoors on rolling terrain without concern. Step 6 — Coach memory: Athlete accepts structured intervals. No accommodation needed beyond noting that early morning starts are rejected — recommend afternoon session if possible, but this is preference, not a safety constraint.",
  "warnings": [
    "Second 20-minute interval should be terminated if power drops below 250W — do not force completion in degraded form as this converts threshold work into junk miles and delays recovery."
  ],
  "alternatives": [
    {
      "scenario": "Athlete reports higher-than-expected fatigue or poor sleep quality despite readiness score of 45",
      "action": "Switch to the 3×15-minute sweet spot variant (245-260W, 89-94% FTP) from the readiness sessionVariants. This provides threshold-adjacent stimulus with lower physiological cost, approximately 85 TSS. It still addresses the Zone 4 gap but with reduced fatigue accumulation."
    },
    {
      "scenario": "Athlete wants to ride outdoors and wind/terrain makes consistent threshold intervals impractical",
      "action": "Prescribe a 'best effort' threshold ride with a time-in-zone target rather than structured intervals: accumulate 35-40 minutes total above 250W (90% FTP) using terrain features (climbs) as natural intervals. HR Zone 4 for the climbing sections. Target 90-100 TSS."
    }
  ],
  "references": [
    "Friel, J. — The Cyclist's Training Bible: TSB zone mapping to session types. TSB −30 to −10 supports endurance, tempo, and controlled threshold work. TSB −12 is ideal for quality threshold stimulus.",
    "Seiler, S. (2010) — Intervals, Thresholds, and Long Slow Distance: the role of intensity distribution in endurance training. Zone distribution analysis confirms the 80/20 polarized model is adequately maintained (78% Z1-2 + 22% Z3+) but the threshold component within the 20% high-intensity portion needs supplementation.",
    "Coggan, A. & Allen, H. — Training and Racing with a Power Meter, 3rd ed. Power zone definitions and 2×20-minute threshold protocol for FTP development."
  ],
  "structured_workout": {
    "type": "intervals",
    "total_duration_min": 90,
    "intervals": [
      {
        "duration_sec": 900,
        "power_target": "50-85% FTP (138-234W)",
        "cadence": "85-95",
        "description": "Progressive warm-up: 5 min Zone 1 easy, 5 min Zone 2 building, 5 min with 3×30s spin-ups to Zone 4"
      },
      {
        "duration_sec": 1200,
        "power_target": "95-105% FTP (260-290W)",
        "cadence": "85-95",
        "description": "Threshold interval 1: steady state, HR allowed to drift to Zone 4 by end. Focus on smooth pedal stroke."
      },
      {
        "duration_sec": 600,
        "power_target": "56-75% FTP (155-206W)",
        "cadence": "90-100",
        "description": "Recovery between intervals: Zone 2 spinning, keep cadence high to clear lactate. Hydrate and take 30g carbs."
      },
      {
        "duration_sec": 1200,
        "power_target": "95-105% FTP (260-290W)",
        "cadence": "85-95",
        "description": "Threshold interval 2: match or exceed interval 1 power if possible. Terminate if power falls below 250W."
      },
      {
        "duration_sec": 900,
        "power_target": "45-65% FTP (124-179W)",
        "cadence": "80-90",
        "description": "Cool-down: gradually reduce power, spin easy, full stop when HR returns to Zone 1."
      }
    ]
  }
}
```
